"""
UniFind - Role-Based Access Control (RBAC) & Safety Guards Service
Provides centralized permission dependencies and critical safety validations.
"""

from typing import List, Callable
from fastapi import Depends, HTTPException, status

try:
    from backend.routers.auth import get_current_user
except ImportError:
    from routers.auth import get_current_user


def require_role(allowed_roles: List[str]) -> Callable:
    """
    Centralized RBAC Dependency:
    Verifies that the authenticated user possesses one of the authorized roles.
    Raises HTTP 403 Forbidden if unauthorized.
    """
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "user")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Administrator privileges required.",
            )
        return current_user

    return role_checker


def require_admin() -> Callable:
    """Shortcut dependency for administrator-only endpoints."""
    return require_role(["admin"])


# ==========================================
# Core Course Safety Guards & Hierarchy
# ==========================================

MAIN_ADMIN_EMAIL = "admin@univ.edu"


def is_main_admin(user: dict) -> bool:
    """Checks if the user is the primary Main Administrator (University Proctor)."""
    return bool(user and user.get("email", "").lower() == MAIN_ADMIN_EMAIL.lower())


def validate_ban_action(target_user: dict, current_user: dict):
    """
    Hierarchical Ban Safety Guards:
    1. Nobody can ban themselves.
    2. Nobody can EVER ban the Main Admin (University Proctor / admin@univ.edu).
    3. The Main Admin (University Proctor) has full access: can ban second admins or students.
    4. Second admins CANNOT ban other administrators or the Main Admin.
    """
    if target_user["id"] == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safety Rule Violation: You cannot ban your own account.",
        )

    if is_main_admin(target_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safety Rule Violation: University Proctor is the Main Administrator and cannot be banned.",
        )

    if not is_main_admin(current_user) and target_user.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safety Rule Violation: Second administrators cannot ban other administrators.",
        )


def validate_role_change(target_user: dict, current_user: dict, new_role: str):
    """
    Hierarchical Role Change Safety Guards:
    1. Nobody can demote their own account (Self-Demotion Lock).
    2. University Proctor (admin@univ.edu) is the permanent Main Administrator and cannot be demoted.
    3. The Main Admin (University Proctor) has full access: can promote or demote any other account.
    4. Second admins CANNOT demote other administrators or touch the Main Admin.
    """
    if target_user["id"] == current_user["id"] and new_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safety Rule Violation: You cannot demote or remove your own administrator privileges.",
        )

    if is_main_admin(target_user) and new_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safety Rule Violation: University Proctor is the permanent Main Administrator and cannot be demoted.",
        )

    if not is_main_admin(current_user) and target_user.get("role") == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safety Rule Violation: Only the Main Administrator (University Proctor) can demote or change administrator accounts.",
        )
