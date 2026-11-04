"""
UniFind - A Web-Based University Lost and Found Management System
FastAPI Backend API
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from database import (
    init_db,
    db_get_all,
    db_get_by_id,
    db_create,
    db_update,
    db_delete,
    db_get_stats,
)
from models import (
    ItemCreate,
    ItemUpdate,
    ItemStatusUpdate,
    ItemResponse,
    StatsResponse,
)


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


@app.get("/api/health", tags=["System"])
def health() -> dict[str, str]:
    """Health check endpoint to verify backend service status."""
    return {"status": "ok", "service": "UniFind API"}


@app.get("/api/stats", response_model=StatsResponse, tags=["Dashboard"])
def get_stats():
    """Get dashboard summary metrics (total, lost, found, returned counts)."""
    return db_get_stats()


# ==========================================
# 5 Core CRUD Endpoints for Assessment
# ==========================================


@app.post(
    "/api/items",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Items (CRUD)"],
    summary="Create a new lost or found item report",
)
def create_item(item: ItemCreate):
    """
    CRUD: CREATE
    Create a new lost or found item report with validation.
    """
    created = db_create(item.model_dump())
    return created


@app.get(
    "/api/items",
    response_model=List[ItemResponse],
    tags=["Items (CRUD)"],
    summary="Read all lost and found item reports",
)
def get_items(
    search: Optional[str] = Query(None, description="Search keyword in title, description, or location"),
    type: Optional[str] = Query(None, description="Filter by report type: 'lost', 'found', or 'all'"),
    category: Optional[str] = Query(None, description="Filter by item category"),
    status: Optional[str] = Query(None, description="Filter by status: 'missing', 'found', 'returned'"),
):
    """
    CRUD: READ (List)
    Retrieve all item reports with optional search, category, type, and status filters.
    """
    return db_get_all(search=search, item_type=type, category=category, status=status)


@app.get(
    "/api/items/{item_id}",
    response_model=ItemResponse,
    tags=["Items (CRUD)"],
    summary="Read a single item report by ID",
)
def get_item(item_id: str):
    """
    CRUD: READ (Single)
    Retrieve full details of a specific item report by its UUID.
    """
    item = db_get_by_id(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )
    return item


@app.put(
    "/api/items/{item_id}",
    response_model=ItemResponse,
    tags=["Items (CRUD)"],
    summary="Update an existing item report",
)
def update_item(item_id: str, item_update: ItemUpdate):
    """
    CRUD: UPDATE
    Update any fields of an existing item report.
    """
    updated = db_update(item_id, item_update.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )
    return updated


@app.patch(
    "/api/items/{item_id}/status",
    response_model=ItemResponse,
    tags=["Items (CRUD)"],
    summary="Quick status update (missing/found/returned)",
)
def update_item_status(item_id: str, status_data: ItemStatusUpdate):
    """
    CRUD: UPDATE (Status)
    Update only the status of an item (e.g. mark as 'returned' or 'found').
    """
    updated = db_update(item_id, {"status": status_data.status})
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )
    return updated


@app.delete(
    "/api/items/{item_id}",
    tags=["Items (CRUD)"],
    summary="Delete an item report",
)
def delete_item(item_id: str):
    """
    CRUD: DELETE
    Remove an item report permanently from the database.
    """
    success = db_delete(item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )
    return {"message": "Item report deleted successfully", "id": item_id}


# Vercel / Single-Project Frontend Mounting
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIR.is_dir() and hasattr(app, "frontend"):
    app.frontend("/", directory=FRONTEND_DIR)
