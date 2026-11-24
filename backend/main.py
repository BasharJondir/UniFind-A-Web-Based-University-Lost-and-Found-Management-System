"""
UniFind - A Web-Based University Lost and Found Management System
FastAPI Backend Application Entry Point
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.responses import JSONResponse

try:
    from backend.database import init_db
    from backend.routers.items import router as items_router
    from backend.routers.system import router as system_router
    from backend.routers.auth import router as auth_router
    from backend.routers.admin import router as admin_router
except ImportError:
    from database import init_db
    from routers.items import router as items_router
    from routers.system import router as system_router
    from routers.auth import router as auth_router
    from routers.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database schema and demo data on application startup
    init_db()
    yield


app = FastAPI(
    title="UniFind API",
    description="REST API for UniFind — University Lost and Found Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
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
app.include_router(auth_router)
app.include_router(items_router)
app.include_router(admin_router)
app.include_router(system_router)


# Support Swagger UI and OpenAPI documentation at both /docs and /api/docs
@app.get("/api/docs", include_in_schema=False)
async def api_docs():
    """Swagger UI documentation accessible under /api/docs."""
    return get_swagger_ui_html(
        openapi_url="/api/openapi.json",
        title=app.title + " - Swagger UI",
    )


@app.get("/api/openapi.json", include_in_schema=False)
async def api_openapi():
    """OpenAPI schema definition accessible under /api/openapi.json."""
    return JSONResponse(app.openapi())


@app.get("/api/redoc", include_in_schema=False)
async def api_redoc():
    """ReDoc documentation accessible under /api/redoc."""
    return get_redoc_html(
        openapi_url="/api/openapi.json",
        title=app.title + " - ReDoc",
    )


# Vercel / Single-Project Frontend Mounting
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIR.is_dir() and hasattr(app, "frontend"):
    app.frontend("/", directory=FRONTEND_DIR)
