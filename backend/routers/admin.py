"""
UniFind - Administrator Management & RBAC Router
Provides protected endpoints for user management, moderation, and role control with safety guards.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

try:
    from backend import crud
    from backend.models import (
        UserResponse,
        BanUserRequest,
        ChangeRoleRequest,
        AdminStatsResponse,
    )
    from backend.services.rbac import (
        require_admin,
        validate_ban_action,
        validate_role_change,
    )
except ImportError:
    import crud
    from models import (
        UserResponse,
        BanUserRequest,
        ChangeRoleRequest,
        AdminStatsResponse,
    )
    from services.rbac import (
        require_admin,
        validate_ban_action,
        validate_role_change,
    )

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin & RBAC Governance"],
    dependencies=[Depends(require_admin())],
)


@router.get(
    "/check",
    summary="Verify administrator privileges",
)
def check_admin_access(current_admin: dict = Depends(require_admin())):
    """Health check for administrator authorization."""
    return {
        "status": "authorized",
        "role": current_admin["role"],
        "admin_name": current_admin["full_name"],
        "email": current_admin["email"],
    }


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get platform moderation metrics (Admin Only)",
)
def get_admin_metrics():
    """Retrieve comprehensive system metrics for the Admin Dashboard."""
    return crud.get_admin_stats()


@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="List all registered campus users (Admin Only)",
)
def list_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role ('user' or 'admin')"),
    is_banned: Optional[bool] = Query(None, description="Filter by ban status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """
    Retrieve registered accounts with optional filtering.
    Restricted to system administrators.
    """
    return crud.get_all_users(
        search=search,
        role=role,
        is_banned=is_banned,
        limit=limit,
        offset=offset,
    )


@router.patch(
    "/users/{user_id}/ban",
    response_model=UserResponse,
    summary="Ban or unban a user with safety guards (Admin Only)",
)
def ban_user(
    user_id: str,
    req: BanUserRequest,
    current_admin: dict = Depends(require_admin()),
):
    """
    Ban or unban a user account.
    Enforces Safety Guards:
    - Admin cannot ban another admin (Guard 1)
    - Admin cannot ban themselves
    - Banning instantly revokes all active sessions for that user (Guard 3)
    """
    target = crud.get_user_by_id(user_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    # Validate action against safety guards
    if req.is_banned:
        validate_ban_action(target, current_admin)

    # Update in database
    updated = crud.update_user_ban(
        user_id=user_id,
        is_banned=req.is_banned,
        ban_reason=req.reason,
    )

    # If banned, immediately revoke all active refresh tokens/sessions (Instant Revocation)
    if req.is_banned:
        crud.revoke_all_user_sessions(user_id)

    return updated


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Change user role (Admin Only)",
)
def change_user_role(
    user_id: str,
    req: ChangeRoleRequest,
    current_admin: dict = Depends(require_admin()),
):
    """
    Promote or demote a user role.
    Enforces Safety Guard 2:
    - Admin cannot demote their own account to prevent lockouts.
    """
    target = crud.get_user_by_id(user_id)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    validate_role_change(target, current_admin, req.role)

    updated = crud.update_user_role(user_id=user_id, new_role=req.role)
    return updated
