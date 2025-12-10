"""
Groupie - SQLModel Database Models
Simplified models for SQLite local development.
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session
import random
import string


# ============================================================================
# DATABASE MODELS
# ============================================================================

class LobbyMember(SQLModel, table=True):
    """
    A member of a lobby.
    Tracks user participation and ready status.
    """
    __tablename__ = "lobby_members"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    lobby_id: int = Field(foreign_key="lobbies.id", index=True)
    user_name: str = Field(max_length=100)
    is_ready: bool = Field(default=False)
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationship
    lobby: Optional["Lobby"] = Relationship(back_populates="members")


class Lobby(SQLModel, table=True):
    """
    A lobby/group for booking activities together.
    """
    __tablename__ = "lobbies"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(max_length=6, unique=True, index=True)
    business_id: Optional[str] = Field(default=None, max_length=50, index=True)  # Nullable for empty lobbies
    leader_name: str = Field(max_length=100)
    status: str = Field(default="OPEN", max_length=20)  # OPEN, LOCKED, CONFIRMED, EXPIRED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(minutes=30))
    
    # Relationship
    members: List[LobbyMember] = Relationship(back_populates="lobby")


# ============================================================================
# DATABASE ENGINE & SESSION
# ============================================================================

import os

# Get database URL from environment (Render/Neon) or default to SQLite (local)
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Production: Use PostgreSQL (Neon)
    # Fix for Render/Heroku: they provide postgres:// but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # Disable SQL logging in production
        pool_pre_ping=True,  # Verify connections before using
    )
    print(f"🐘 Using PostgreSQL database")
else:
    # Local development: Use SQLite
    DATABASE_URL = "sqlite:///./groupie.db"
    engine = create_engine(
        DATABASE_URL,
        echo=True,  # Log SQL queries for debugging
        connect_args={"check_same_thread": False}  # Required for SQLite with FastAPI
    )
    print(f"🗄️ Using SQLite database (local development)")


def create_db_and_tables():
    """Initialize the database and create all tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Get a database session."""
    with Session(engine) as session:
        yield session


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_lobby_code(session: Session, length: int = 6) -> str:
    """
    Generate a unique 6-character lobby code.
    Avoids ambiguous characters (0, O, I, 1, L).
    """
    characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    
    for _ in range(100):  # Max attempts to avoid infinite loop
        code = ''.join(random.choices(characters, k=length))
        # Check if code already exists
        existing = session.exec(
            __import__('sqlmodel').select(Lobby).where(Lobby.code == code)
        ).first()
        if not existing:
            return code
    
    raise ValueError("Could not generate unique lobby code")
