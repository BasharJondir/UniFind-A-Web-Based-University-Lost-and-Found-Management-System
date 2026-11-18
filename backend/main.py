"""
UniFind - A Web-Based University Lost and Found Management System
FastAPI Backend Application Entry Point
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.database import init_db
    from backend.routers.items import router as items_router
    from backend.routers.system import router as system_router
except ImportError:
    from database import init_db
    from routers.items import router as items_router
    from routers.system import router as system_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schema and demo data on application startup
    init_db()
    yield


app = FastAPI(
    title="UniFind API",
    description="REST API for UniFind — University Lost and Found Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local development (e.g. Vite frontend at localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(items_router)
app.include_router(system_router)

# Vercel / Single-Project Frontend Mounting
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIR.is_dir() and hasattr(app, "frontend"):
    app.frontend("/", directory=FRONTEND_DIR)
