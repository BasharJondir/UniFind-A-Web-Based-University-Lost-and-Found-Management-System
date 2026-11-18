"""
UniFind - Lost & Found Items Router
Provides RESTful CRUD endpoints for lost and found reports.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

try:
    from backend import crud
    from backend.models import (
        ItemCreate,
        ItemUpdate,
        ItemStatusUpdate,
        ItemResponse,
    )
except ImportError:
    import crud
    from models import (
        ItemCreate,
        ItemUpdate,
        ItemStatusUpdate,
        ItemResponse,
    )

router = APIRouter(prefix="/api/items", tags=["Items (CRUD)"])


@router.post(
    "",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lost or found item report",
)
def create_item(item: ItemCreate):
    """
    CRUD: CREATE
    Create a new lost or found item report with validation.
    """
    return crud.create(item.model_dump())


@router.get(
    "",
    response_model=List[ItemResponse],
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
    return crud.get_all(search=search, item_type=type, category=category, status=status)


@router.get(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Read a single item report by ID",
)
def get_item(item_id: str):
    """
    CRUD: READ (Single)
    Retrieve full details of a specific item report by its UUID.
    """
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )
    return item


@router.put(
    "/{item_id}",
    response_model=ItemResponse,
    summary="Update an existing item report",
)
def update_item(item_id: str, item_update: ItemUpdate):
    """
    CRUD: UPDATE
    Update any fields of an existing item report.
    """
    updated = crud.update(item_id, item_update.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )
    return updated


@router.patch(
    "/{item_id}/status",
    response_model=ItemResponse,
    summary="Quick status update (missing/found/returned)",
)
def update_item_status(item_id: str, status_data: ItemStatusUpdate):
    """
    CRUD: UPDATE (Status)
    Update only the status of an item (e.g. mark as 'returned' or 'found').
    """
    updated = crud.update(item_id, {"status": status_data.status})
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )
    return updated


@router.delete(
    "/{item_id}",
    summary="Delete an item report",
)
def delete_item(item_id: str):
    """
    CRUD: DELETE
    Remove an item report permanently from the database.
    """
    success = crud.delete(item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )
    return {"message": "Item report deleted successfully", "id": item_id}
