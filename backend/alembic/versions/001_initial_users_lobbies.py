"""Create users and lobbies tables

Revision ID: 001_initial
Revises: 
Create Date: 2025-12-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_users_email', 'users', ['email'])

    # Create lobbies table (simplified for Join Lobby feature)
    op.create_table(
        'lobbies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('code', sa.String(20), unique=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), default='open'),
        sa.Column('is_public', sa.Boolean(), default=True),
        sa.Column('current_member_count', sa.Integer(), default=0),
        sa.Column('max_capacity', sa.Integer(), default=8),
        sa.Column('creator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('booking_deadline', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('idx_lobbies_code', 'lobbies', ['code'])
    op.create_index('idx_lobbies_status', 'lobbies', ['status'])
    op.create_index('idx_lobbies_creator', 'lobbies', ['creator_id'])


def downgrade() -> None:
    op.drop_index('idx_lobbies_creator', 'lobbies')
    op.drop_index('idx_lobbies_status', 'lobbies')
    op.drop_index('idx_lobbies_code', 'lobbies')
    op.drop_table('lobbies')
    
    op.drop_index('idx_users_email', 'users')
    op.drop_table('users')
