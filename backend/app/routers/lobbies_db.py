"""
Lobbies API endpoints - Database-backed version
Manages group sessions with SQLite persistence.
"""

import random
import string
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db_models import Lobby, LobbyMember, engine, get_session, create_db_and_tables

router = APIRouter(prefix="/lobbies", tags=["lobbies"])


# ============================================================================
# Request/Response Schemas
# ============================================================================

class CreateLobbyRequest(BaseModel):
    business_id: Optional[str] = None  # Optional for empty lobbies
    leader_name: str


class CreateLobbyResponse(BaseModel):
    lobby_code: str
    lobby_id: int


class JoinLobbyRequest(BaseModel):
    user_name: str


class MemberInfo(BaseModel):
    user_name: str
    is_ready: bool = False


class LobbyStatusResponse(BaseModel):
    lobby_id: int
    lobby_code: str
    business_id: Optional[str] = None  # Can be null for empty lobbies
    leader_name: str
    status: str
    member_count: int
    members: List[MemberInfo]
    created_at: str
    expires_at: str


class UpdateLobbyRequest(BaseModel):
    business_id: str  # Required when updating


class ReadyRequest(BaseModel):
    user_name: str


# ============================================================================
# Constants
# ============================================================================

LOBBY_EXPIRY_HOURS = 2


# ============================================================================
# Helper Functions
# ============================================================================

def generate_lobby_code(session: Session, length: int = 6) -> str:
    """Generate a unique 6-character lobby code."""
    characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    
    for _ in range(100):
        code = ''.join(random.choices(characters, k=length))
        existing = session.exec(select(Lobby).where(Lobby.code == code)).first()
        if not existing:
            return code
    
    raise ValueError("Could not generate unique lobby code")


def check_lobby_expiration(lobby: Lobby, session: Session) -> Lobby:
    """Check if lobby has expired and update status if needed."""
    if lobby.status == "OPEN" and datetime.now(timezone.utc) > lobby.expires_at.replace(tzinfo=timezone.utc):
        lobby.status = "EXPIRED"
        session.add(lobby)
        session.commit()
        session.refresh(lobby)
    return lobby


# ============================================================================
# Endpoints
# ============================================================================

@router.post("", response_model=CreateLobbyResponse)
def create_lobby(request: CreateLobbyRequest, session: Session = Depends(get_session)):
    """
    Create a new lobby/group session.
    
    - Generates a unique 6-char code
    - Creates lobby with status "OPEN"
    - Adds the leader as the first member
    - Returns the lobby code
    """
    # Generate unique code
    lobby_code = generate_lobby_code(session)
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=LOBBY_EXPIRY_HOURS)
    
    # Create lobby
    lobby = Lobby(
        code=lobby_code,
        business_id=request.business_id,
        leader_name=request.leader_name,
        status="OPEN",
        created_at=now,
        expires_at=expires_at,
    )
    session.add(lobby)
    session.commit()
    session.refresh(lobby)
    
    # Add leader as first member
    leader_member = LobbyMember(
        lobby_id=lobby.id,
        user_name=request.leader_name,
        is_ready=False,
        joined_at=now,
    )
    session.add(leader_member)
    session.commit()
    
    return CreateLobbyResponse(
        lobby_code=lobby_code,
        lobby_id=lobby.id,
    )


@router.get("/{code}", response_model=LobbyStatusResponse)
def get_lobby(code: str, session: Session = Depends(get_session)):
    """
    Get lobby status and member list by code.
    """
    # Find lobby by code
    lobby = session.exec(select(Lobby).where(Lobby.code == code.upper())).first()
    
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby ikke funnet")
    
    # Check expiration
    lobby = check_lobby_expiration(lobby, session)
    
    # Get members
    members = session.exec(select(LobbyMember).where(LobbyMember.lobby_id == lobby.id)).all()
    
    return LobbyStatusResponse(
        lobby_id=lobby.id,
        lobby_code=lobby.code,
        business_id=lobby.business_id,
        leader_name=lobby.leader_name,
        status=lobby.status,
        member_count=len(members),
        members=[MemberInfo(user_name=m.user_name, is_ready=m.is_ready) for m in members],
        created_at=lobby.created_at.isoformat(),
        expires_at=lobby.expires_at.isoformat(),
    )


@router.post("/{code}/join")
def join_lobby(code: str, request: JoinLobbyRequest, session: Session = Depends(get_session)):
    """
    Join an existing lobby by code.
    """
    # Find lobby
    lobby = session.exec(select(Lobby).where(Lobby.code == code.upper())).first()
    
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby ikke funnet")
    
    # Check expiration
    lobby = check_lobby_expiration(lobby, session)
    
    if lobby.status != "OPEN":
        raise HTTPException(status_code=400, detail=f"Lobby er {lobby.status}, kan ikke bli med")
    
    # Check if user already in lobby
    existing_member = session.exec(
        select(LobbyMember).where(
            LobbyMember.lobby_id == lobby.id,
            LobbyMember.user_name == request.user_name
        )
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="Du er allerede med i denne lobbyen")
    
    # Add new member
    new_member = LobbyMember(
        lobby_id=lobby.id,
        user_name=request.user_name,
        is_ready=False,
        joined_at=datetime.now(timezone.utc),
    )
    session.add(new_member)
    session.commit()
    
    # Get updated member count
    members = session.exec(select(LobbyMember).where(LobbyMember.lobby_id == lobby.id)).all()
    
    return {
        "message": f"{request.user_name} ble med i lobbyen",
        "member_count": len(members),
    }


@router.post("/{code}/ready")
def toggle_ready(code: str, request: ReadyRequest, session: Session = Depends(get_session)):
    """
    Toggle ready status for a member.
    If all members are ready, lock the lobby.
    """
    # Find lobby
    lobby = session.exec(select(Lobby).where(Lobby.code == code.upper())).first()
    
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby ikke funnet")
    
    if lobby.status not in ["OPEN", "LOCKED"]:
        raise HTTPException(status_code=400, detail=f"Kan ikke endre status når lobby er {lobby.status}")
    
    # Find member
    member = session.exec(
        select(LobbyMember).where(
            LobbyMember.lobby_id == lobby.id,
            LobbyMember.user_name == request.user_name
        )
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Bruker ikke funnet i lobbyen")
    
    # Toggle ready status
    member.is_ready = not member.is_ready
    session.add(member)
    session.commit()
    
    # Check if all members are ready
    members = session.exec(select(LobbyMember).where(LobbyMember.lobby_id == lobby.id)).all()
    all_ready = all(m.is_ready for m in members) and len(members) >= 2
    
    if all_ready and lobby.status == "OPEN":
        lobby.status = "LOCKED"
        session.add(lobby)
        session.commit()
    elif not all_ready and lobby.status == "LOCKED":
        lobby.status = "OPEN"
        session.add(lobby)
        session.commit()
    
    session.refresh(lobby)
    
    return {
        "is_ready": member.is_ready,
        "all_ready": all_ready,
        "lobby_status": lobby.status,
    }


@router.post("/{code}/confirm")
def confirm_lobby(code: str, session: Session = Depends(get_session)):
    """
    Confirm a locked lobby (finalize booking).
    """
    lobby = session.exec(select(Lobby).where(Lobby.code == code.upper())).first()
    
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby ikke funnet")
    
    if lobby.status != "LOCKED":
        raise HTTPException(status_code=400, detail="Lobby må være låst for å bekrefte")
    
    lobby.status = "CONFIRMED"
    session.add(lobby)
    session.commit()
    
    return {"message": "Booking bekreftet!", "status": "CONFIRMED"}


@router.patch("/{code}")
def update_lobby(code: str, request: UpdateLobbyRequest, session: Session = Depends(get_session)):
    """
    Update a lobby's business_id.
    Used when an empty lobby selects a business.
    """
    lobby = session.exec(select(Lobby).where(Lobby.code == code.upper())).first()
    
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby ikke funnet")
    
    if lobby.status != "OPEN":
        raise HTTPException(status_code=400, detail=f"Kan ikke oppdatere lobby med status {lobby.status}")
    
    lobby.business_id = request.business_id
    session.add(lobby)
    session.commit()
    session.refresh(lobby)
    
    return {
        "message": "Lobby oppdatert",
        "lobby_code": lobby.code,
        "business_id": lobby.business_id,
    }
