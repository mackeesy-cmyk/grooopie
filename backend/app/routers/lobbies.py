"""
Lobbies API endpoints for creating and managing group sessions.
"""

import random
import string
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/lobbies", tags=["lobbies"])


# ============================================================================
# Request/Response Schemas
# ============================================================================

class CreateLobbyRequest(BaseModel):
    business_id: str
    leader_name: str


class CreateLobbyResponse(BaseModel):
    lobby_code: str
    lobby_id: str


class MemberInfo(BaseModel):
    user_name: str
    is_ready: bool = False


class LobbyStatusResponse(BaseModel):
    lobby_id: str
    lobby_code: str
    business_id: str
    leader_name: str
    status: str
    member_count: int
    members: list[MemberInfo]
    created_at: str
    expires_at: str


# ============================================================================
# In-Memory Storage (erstattes med database senere)
# ============================================================================

# Midlertidig lagring for lobbyer (erstattes med ekte DB)
LOBBIES_STORE: dict = {}


# ============================================================================
# Helper Functions
# ============================================================================

def generate_lobby_code(length: int = 6) -> str:
    """Generer en tilfeldig 6-tegns lobbykode."""
    characters = string.ascii_uppercase + string.digits
    # Fjern tegn som kan forveksles (0, O, I, 1, L)
    characters = characters.replace('0', '').replace('O', '').replace('I', '').replace('1', '').replace('L', '')
    
    while True:
        code = ''.join(random.choices(characters, k=length))
        # Sjekk at koden ikke allerede er i bruk
        if code not in [lobby.get('code') for lobby in LOBBIES_STORE.values()]:
            return code


# Lobby-utløpstid i minutter
LOBBY_EXPIRY_MINUTES = 30


# ============================================================================
# Endpoints
# ============================================================================

@router.post("", response_model=CreateLobbyResponse)
async def create_lobby(request: CreateLobbyRequest) -> CreateLobbyResponse:
    """
    Opprett en ny lobby/gruppe-sesjon.
    
    - Genererer en unik 6-tegns kode
    - Oppretter lobby med status "OPEN"
    - Setter utløpstid til 30 minutter fra nå
    - Returnerer lobbykoden
    """
    # Generer unik kode
    lobby_code = generate_lobby_code()
    lobby_id = f"lobby_{len(LOBBIES_STORE) + 1}"
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=LOBBY_EXPIRY_MINUTES)
    
    # Opprett lobby-post med medlemmer som objekter
    lobby_data = {
        "id": lobby_id,
        "code": lobby_code,
        "business_id": request.business_id,
        "leader_name": request.leader_name,
        "status": "OPEN",
        "members": [{"user_name": request.leader_name, "is_ready": False}],
        "member_count": 1,
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
    }
    
    # Lagre i minne (erstattes med DB)
    LOBBIES_STORE[lobby_id] = lobby_data
    
    return CreateLobbyResponse(
        lobby_code=lobby_code,
        lobby_id=lobby_id
    )


@router.get("/{lobby_code}", response_model=LobbyStatusResponse)
async def get_lobby_by_code(lobby_code: str) -> LobbyStatusResponse:
    """
    Hent lobby-status ved å bruke lobbykoden.
    
    Sjekker automatisk om lobbyen har utløpt og oppdaterer status.
    """
    now = datetime.now(timezone.utc)
    
    # Finn lobby basert på kode
    for lobby_id, lobby in LOBBIES_STORE.items():
        if lobby.get("code") == lobby_code.upper():
            # Sjekk om lobbyen har utløpt
            if lobby["status"] == "OPEN" and "expires_at" in lobby:
                expires_at = datetime.fromisoformat(lobby["expires_at"].replace("Z", "+00:00"))
                if now > expires_at:
                    lobby["status"] = "EXPIRED"
            
            return LobbyStatusResponse(
                lobby_id=lobby["id"],
                lobby_code=lobby["code"],
                business_id=lobby["business_id"],
                leader_name=lobby["leader_name"],
                status=lobby["status"],
                member_count=lobby["member_count"],
                members=[MemberInfo(**m) if isinstance(m, dict) else MemberInfo(user_name=m) for m in lobby["members"]],
                created_at=lobby["created_at"],
                expires_at=lobby.get("expires_at", ""),
            )
    
    raise HTTPException(status_code=404, detail="Lobby ikke funnet")


class JoinLobbyRequest(BaseModel):
    user_name: str


class JoinLobbyResponse(BaseModel):
    success: bool
    message: str
    member_count: int
    members: list[str]


# Maksimalt antall medlemmer per lobby
MAX_LOBBY_MEMBERS = 8

# Lobby-utløpstid i sekunder (1 time)
LOBBY_EXPIRY_SECONDS = 3600


@router.post("/{lobby_code}/join", response_model=JoinLobbyResponse)
async def join_lobby(lobby_code: str, request: JoinLobbyRequest) -> JoinLobbyResponse:
    """
    Bli med i en eksisterende lobby.
    
    Validering:
    - Sjekker om lobbyen eksisterer
    - Sjekker om lobbyen er åpen (ikke lukket)
    - Sjekker om lobbyen er full
    - Sjekker om lobbyen har utløpt (over 1 time gammel)
    """
    # Finn lobby basert på kode
    for lobby_id, lobby in LOBBIES_STORE.items():
        if lobby.get("code") == lobby_code.upper():
            # Sjekk om lobbyen er åpen
            if lobby["status"] != "OPEN":
                raise HTTPException(
                    status_code=400, 
                    detail="Lobbyen er ikke åpen for nye medlemmer"
                )
            
            # Sjekk om lobbyen er full
            if lobby["member_count"] >= MAX_LOBBY_MEMBERS:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Lobbyen er full (maks {MAX_LOBBY_MEMBERS} medlemmer)"
                )
            
            # Sjekk om lobbyen har utløpt
            created_at = datetime.fromisoformat(lobby["created_at"].replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            age_seconds = (now - created_at).total_seconds()
            
            if age_seconds > LOBBY_EXPIRY_SECONDS:
                lobby["status"] = "EXPIRED"
                raise HTTPException(
                    status_code=400, 
                    detail="Lobbyen har utløpt. Opprett en ny gruppe."
                )
            
            # Sjekk om brukeren allerede er medlem
            member_names = [m["user_name"] if isinstance(m, dict) else m for m in lobby["members"]]
            if request.user_name in member_names:
                raise HTTPException(
                    status_code=400, 
                    detail="Du er allerede medlem av denne gruppen"
                )
            
            # Legg til medlem som objekt
            lobby["members"].append({"user_name": request.user_name, "is_ready": False})
            lobby["member_count"] = len(lobby["members"])
            
            return JoinLobbyResponse(
                success=True,
                message=f"Velkommen til gruppen, {request.user_name}!",
                member_count=lobby["member_count"],
                members=[m["user_name"] if isinstance(m, dict) else m for m in lobby["members"]]
            )
    
    raise HTTPException(status_code=404, detail="Lobby ikke funnet")


# ============================================================================
# Ready Endpoint
# ============================================================================

class ReadyRequest(BaseModel):
    user_name: str


class ReadyResponse(BaseModel):
    success: bool
    message: str
    all_ready: bool
    lobby_status: str


@router.post("/{lobby_code}/ready", response_model=ReadyResponse)
async def mark_ready(lobby_code: str, request: ReadyRequest) -> ReadyResponse:
    """
    Marker en bruker som klar.
    
    Hvis alle medlemmer er klare, settes lobby-status til LOCKED.
    """
    for lobby_id, lobby in LOBBIES_STORE.items():
        if lobby.get("code") == lobby_code.upper():
            if lobby["status"] != "OPEN":
                raise HTTPException(
                    status_code=400,
                    detail="Lobbyen er ikke lenger åpen"
                )
            
            # Finn og oppdater medlemmet
            member_found = False
            for member in lobby["members"]:
                if isinstance(member, dict) and member.get("user_name") == request.user_name:
                    member["is_ready"] = True
                    member_found = True
                    break
            
            if not member_found:
                raise HTTPException(
                    status_code=404,
                    detail="Bruker ikke funnet i lobbyen"
                )
            
            # Sjekk om alle er klare
            all_ready = all(
                isinstance(m, dict) and m.get("is_ready", False) 
                for m in lobby["members"]
            )
            
            # Hvis alle er klare, lås lobbyen
            if all_ready and lobby["member_count"] >= 2:
                lobby["status"] = "LOCKED"
            
            return ReadyResponse(
                success=True,
                message=f"{request.user_name} er nå klar!",
                all_ready=all_ready,
                lobby_status=lobby["status"]
            )
    
    raise HTTPException(status_code=404, detail="Lobby ikke funnet")
