"""
UniFind - Lost & Found Items Router
Provides RESTful CRUD endpoints for lost and found reports with strict ownership & RBAC enforcement.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

try:
    from backend import crud
    from backend.models import (
        ItemCreate,
        ItemUpdate,
        ItemStatusUpdate,
        ItemResponse,
    )
    from backend.routers.auth import (
        get_current_user,
        get_optional_current_user,
    )
except ImportError:
    import crud
    from models import (
        ItemCreate,
        ItemUpdate,
        ItemStatusUpdate,
        ItemResponse,
    )
    from routers.auth import (
        get_current_user,
        get_optional_current_user,
    )

router = APIRouter(prefix="/api/items", tags=["Items (CRUD)"])


def check_item_ownership(item: dict, current_user: dict):
    """
    Ownership & RBAC Guard:
    - Author of the report (matching user_id or contact_email) is allowed.
    - User with role 'admin' is allowed to moderate any report.
    - Any other student is rejected with HTTP 403 Forbidden.
    """
    is_owner = (
        (item.get("user_id") and item["user_id"] == current_user["id"])
        or (
            item.get("contact_email")
            and current_user.get("email")
            and item["contact_email"].lower() == current_user["email"].lower()
        )
    )
    is_admin = current_user.get("role") == "admin"

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: You can only modify your own reported items.",
        )


@router.post(
    "",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new lost or found item report (Requires Login)",
)
def create_item(
    item: ItemCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    CRUD: CREATE
    Create a new lost or found report automatically associated with the authenticated user.
    """
    item_dict = item.model_dump()
    item_dict["user_id"] = current_user["id"]
    if not item_dict.get("contact_email"):
        item_dict["contact_email"] = current_user["email"]

    return crud.create(item_dict)


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
    my_items: bool = Query(False, description="Filter to only the current user's submitted reports"),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """
    CRUD: READ (List)
    Retrieve item reports with optional filters.
    If my_items=True, returns only reports created by the authenticated student.
    """
    user_id = None
    user_email = None

    if my_items:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to filter by your submissions.",
            )
        user_id = current_user["id"]
        user_email = current_user["email"]

    return crud.get_all(
        search=search,
        item_type=type,
        category=category,
        status=status,
        user_id=user_id,
        user_email=user_email,
    )


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
    summary="Update an existing item report (Owner or Admin only)",
)
def update_item(
    item_id: str,
    item_update: ItemUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    CRUD: UPDATE
    Update any fields of an existing item report.
    Protected: Only the author of the report or a university Admin can edit.
    """
    existing = crud.get_by_id(item_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )

    check_item_ownership(existing, current_user)

    updated = crud.update(item_id, item_update.model_dump(exclude_unset=True))
    return updated


@router.patch(
    "/{item_id}/status",
    response_model=ItemResponse,
    summary="Quick status update (Owner or Admin only)",
)
def update_item_status(
    item_id: str,
    status_data: ItemStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    CRUD: UPDATE (Status)
    Update only the status of an item (e.g. mark as 'returned').
    Protected: Only the author or a university Admin can change status.
    """
    existing = crud.get_by_id(item_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )

    check_item_ownership(existing, current_user)

    updated = crud.update(item_id, {"status": status_data.status})
    return updated


@router.delete(
    "/{item_id}",
    summary="Delete an item report (Owner or Admin only)",
)
def delete_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    CRUD: DELETE
    Remove an item report permanently from the database.
    Protected: Only the author of the report or a university Admin can delete.
    """
    existing = crud.get_by_id(item_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID '{item_id}' not found.",
        )

    check_item_ownership(existing, current_user)

    crud.delete(item_id)
    return {"message": "Item report deleted successfully", "id": item_id}
