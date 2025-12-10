"""
Groupie - Group Discount Platform API

Main FastAPI application entry point.
Database-backed version with SQLite.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db_models import create_db_and_tables
from routers import businesses, merchant
from routers import lobbies_db as lobbies  # Use database-backed lobbies


# Lifespan handler for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    print("🚀 Starting Groupie API...")
    create_db_and_tables()
    print("✅ Database initialized!")
    yield
    print("👋 Shutting down Groupie API...")


# Create FastAPI app
app = FastAPI(
    title="Groupie API",
    description="Group discount booking platform - save more when you book together!",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(businesses.router)
app.include_router(lobbies.router)
app.include_router(merchant.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Groupie API", "database": "SQLite"}


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "version": "0.2.0",
        "database": "SQLite (groupie.db)",
    }
