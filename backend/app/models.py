"""
Groupie - Group Discount Platform
PostgreSQL Database Schema using SQLAlchemy ORM

This schema supports a group discount booking platform where users can join
lobbies for activities, and prices decrease as more people join.
"""

from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, 
    ForeignKey, Numeric, Enum, UniqueConstraint, Index, CheckConstraint
)
from sqlalchemy.orm import relationship, DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


# ============================================================================
# ENUMS
# ============================================================================

class LobbyStatus(PyEnum):
    """Status of a lobby."""
    OPEN = "open"               # Accepting new members
    FULL = "full"               # Max capacity reached
    CONFIRMED = "confirmed"     # Booking confirmed, waiting for activity
    COMPLETED = "completed"     # Activity has taken place
    CANCELLED = "cancelled"     # Lobby was cancelled


class BookingStatus(PyEnum):
    """Status of a user's booking in a lobby."""
    PENDING = "pending"         # User joined, awaiting confirmation
    CONFIRMED = "confirmed"     # Booking confirmed
    CANCELLED = "cancelled"     # User cancelled


# ============================================================================
# USERS
# ============================================================================

class User(Base):
    """
    User accounts for the platform.
    Stores authentication info and profile data.
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )

    # Relationships
    lobby_memberships: Mapped[List["LobbyMember"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )
    created_lobbies: Mapped[List["Lobby"]] = relationship(
        back_populates="creator",
        foreign_keys="Lobby.creator_id"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"


# ============================================================================
# ACTIVITIES
# ============================================================================

class Activity(Base):
    """
    Activities/experiences that can be booked.
    E.g., escape rooms, cooking classes, group tours, etc.
    """
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Location info
    location_name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Capacity constraints
    min_participants: Mapped[int] = mapped_column(Integer, default=2)
    max_participants: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Base pricing (before discounts)
    base_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="SEK")
    
    # Duration in minutes
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Media
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )

    # Relationships
    time_slots: Mapped[List["TimeSlot"]] = relationship(
        back_populates="activity",
        cascade="all, delete-orphan"
    )
    discount_tiers: Mapped[List["DiscountTier"]] = relationship(
        back_populates="activity",
        cascade="all, delete-orphan",
        order_by="DiscountTier.min_participants"
    )

    # Constraints
    __table_args__ = (
        CheckConstraint('min_participants > 0', name='check_min_participants_positive'),
        CheckConstraint('max_participants >= min_participants', name='check_max_gte_min'),
        CheckConstraint('base_price >= 0', name='check_base_price_non_negative'),
        Index('idx_activities_category', 'category'),
        Index('idx_activities_city', 'city'),
    )

    def __repr__(self) -> str:
        return f"<Activity {self.name}>"


# ============================================================================
# TIME SLOTS
# ============================================================================

class TimeSlot(Base):
    """
    Available time slots for activities.
    Each slot can have one lobby associated with it.
    """
    __tablename__ = "time_slots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("activities.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Slot timing
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    
    # Availability
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    activity: Mapped["Activity"] = relationship(back_populates="time_slots")
    lobby: Mapped[Optional["Lobby"]] = relationship(
        back_populates="time_slot",
        uselist=False
    )

    # Constraints
    __table_args__ = (
        CheckConstraint('end_time > start_time', name='check_end_after_start'),
        Index('idx_time_slots_activity', 'activity_id'),
        Index('idx_time_slots_start_time', 'start_time'),
        UniqueConstraint('activity_id', 'start_time', name='uq_activity_start_time'),
    )

    def __repr__(self) -> str:
        return f"<TimeSlot {self.start_time} for Activity {self.activity_id}>"


# ============================================================================
# DISCOUNT TIERS
# ============================================================================

class DiscountTier(Base):
    """
    Discount tiers based on group size.
    The more people join, the bigger the discount!
    
    Example tiers for an activity:
    - 2-3 people: 0% discount (base price)
    - 4-5 people: 10% discount
    - 6-8 people: 20% discount
    - 9+ people: 30% discount
    """
    __tablename__ = "discount_tiers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    activity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("activities.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Tier thresholds
    min_participants: Mapped[int] = mapped_column(Integer, nullable=False)
    max_participants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # NULL = no upper limit
    
    # Discount (percentage off base price)
    discount_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    
    # Optional: fixed price override instead of percentage
    fixed_price_per_person: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Tier name for display
    tier_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "Solo", "Duo", "Squad"

    # Relationships
    activity: Mapped["Activity"] = relationship(back_populates="discount_tiers")

    # Constraints
    __table_args__ = (
        CheckConstraint('min_participants > 0', name='check_tier_min_positive'),
        CheckConstraint(
            'max_participants IS NULL OR max_participants >= min_participants', 
            name='check_tier_max_gte_min'
        ),
        CheckConstraint(
            'discount_percentage >= 0 AND discount_percentage <= 100', 
            name='check_discount_range'
        ),
        Index('idx_discount_tiers_activity', 'activity_id'),
        UniqueConstraint('activity_id', 'min_participants', name='uq_activity_tier'),
    )

    def __repr__(self) -> str:
        return f"<DiscountTier {self.tier_name or self.min_participants}+ = {self.discount_percentage}% off>"


# ============================================================================
# LOBBIES (Groups)
# ============================================================================

class Lobby(Base):
    """
    A lobby represents a group of users joining together for an activity.
    As more users join, the discount tier improves for everyone!
    """
    __tablename__ = "lobbies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    # Linked activity and time slot
    time_slot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("time_slots.id", ondelete="CASCADE"),
        unique=True,  # One lobby per time slot
        nullable=False
    )
    
    # Lobby creator
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Lobby details
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Optional custom name
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Current state
    status: Mapped[LobbyStatus] = mapped_column(
        Enum(LobbyStatus), 
        default=LobbyStatus.OPEN
    )
    current_member_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Visibility
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)  # Can strangers join?
    invite_code: Mapped[Optional[str]] = mapped_column(String(20), unique=True, nullable=True)
    
    # Booking deadline
    booking_deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )

    # Relationships
    time_slot: Mapped["TimeSlot"] = relationship(back_populates="lobby")
    creator: Mapped[Optional["User"]] = relationship(
        back_populates="created_lobbies",
        foreign_keys=[creator_id]
    )
    members: Mapped[List["LobbyMember"]] = relationship(
        back_populates="lobby",
        cascade="all, delete-orphan"
    )

    # Constraints
    __table_args__ = (
        Index('idx_lobbies_status', 'status'),
        Index('idx_lobbies_creator', 'creator_id'),
        Index('idx_lobbies_invite_code', 'invite_code'),
    )

    def __repr__(self) -> str:
        return f"<Lobby {self.id} - {self.status.value}>"


# ============================================================================
# LOBBY MEMBERS (Junction Table)
# ============================================================================

class LobbyMember(Base):
    """
    Junction table tracking which users are in which lobbies.
    Also stores their individual booking status and payment info.
    """
    __tablename__ = "lobby_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    lobby_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("lobbies.id", ondelete="CASCADE"),
        nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Member status
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus), 
        default=BookingStatus.PENDING
    )
    
    # Number of spots this member is reserving (for bringing friends)
    spots_reserved: Mapped[int] = mapped_column(Integer, default=1)
    
    # Price locked in at time of joining
    price_at_booking: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    discount_percentage_at_booking: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Payment tracking
    has_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    payment_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Timestamps
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )

    # Relationships
    lobby: Mapped["Lobby"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="lobby_memberships")

    # Constraints
    __table_args__ = (
        UniqueConstraint('lobby_id', 'user_id', name='uq_lobby_user'),
        CheckConstraint('spots_reserved > 0', name='check_spots_positive'),
        Index('idx_lobby_members_lobby', 'lobby_id'),
        Index('idx_lobby_members_user', 'user_id'),
    )

    def __repr__(self) -> str:
        return f"<LobbyMember User {self.user_id} in Lobby {self.lobby_id}>"
