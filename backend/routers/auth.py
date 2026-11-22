"""
UniFind - Authentication & Session Router
Provides registration, login, refresh token rotation, logout, and profile endpoints.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Header,
    Request,
    Response,
    status,
)
from pydantic import BaseModel

try:
    from backend import crud
    from backend.auth import (
        create_access_token,
        decode_access_token,
        generate_refresh_token,
        hash_password,
        hash_token,
        verify_password,
        REFRESH_TOKEN_EXPIRE_DAYS,
    )
    from backend.models import (
        UserCreate,
        UserLogin,
        UserResponse,
        TokenResponse,
    )
except ImportError:
    import crud
    from auth import (
        create_access_token,
        decode_access_token,
        generate_refresh_token,
        hash_password,
        hash_token,
        verify_password,
        REFRESH_TOKEN_EXPIRE_DAYS,
    )
    from models import (
        UserCreate,
        UserLogin,
        UserResponse,
        TokenResponse,
    )

router = APIRouter(tags=["Authentication"])


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


# Dependency to extract and verify the current logged-in user from the Bearer token
def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Extract and validate the JWT access token from the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired or is invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    user = crud.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
        )

    if user.get("is_banned"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by an administrator.",
        )

    return user


@router.post(
    "/api/auth/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student account",
)
@router.post(
    "/api/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def signup(user_data: UserCreate):
    """
    Register a new user account with hashed password.
    Rejects duplicate emails.
    """
    existing = crud.get_user_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{user_data.email}' already exists.",
        )

    pw_hash = hash_password(user_data.password)
    new_user = crud.create_user(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=pw_hash,
        role=user_data.role or "user",
    )
    return new_user


@router.post(
    "/api/auth/login",
    response_model=TokenResponse,
    summary="Authenticate user and issue JWT + refresh token",
)
def login(login_data: UserLogin, response: Response):
    """
    Log in with email and password.
    Returns a 15-minute JWT access token in the response body,
    and sets a secure HttpOnly refresh token cookie for session persistence.
    """
    user = crud.get_user_by_email(login_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if user.get("is_banned"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by an administrator.",
        )

    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 1. Generate 15-min Access Token
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )

    # 2. Generate Refresh Token & store SHA-256 hash in DB
    raw_refresh_token = generate_refresh_token()
    token_hash = hash_token(raw_refresh_token)
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    ).isoformat()

    crud.create_user_session(
        user_id=user["id"],
        token_hash=token_hash,
        expires_at=expires_at,
    )

    # 3. Set secure HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=False,  # Allow http on localhost; set secure in production
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/api/auth",
    )

    user_info = UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        is_banned=bool(user["is_banned"]),
        created_at=user["created_at"],
    )

    return TokenResponse(access_token=access_token, user=user_info)


@router.post(
    "/api/auth/refresh",
    summary="Obtain a new 15-minute access token using refresh token",
)
def refresh_token(
    request: Request,
    response: Response,
    body: Optional[RefreshTokenRequest] = None,
):
    """
    Exchange a valid, unrevoked refresh token for a fresh 15-minute access token.
    Accepts refresh token via HttpOnly cookie or request body.
    """
    raw_token = request.cookies.get("refresh_token")
    if not raw_token and body and body.refresh_token:
        raw_token = body.refresh_token

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided.",
        )

    token_hash = hash_token(raw_token)
    session = crud.get_user_session(token_hash)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token session.",
        )

    if session.get("is_revoked"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked. Please log in again.",
        )

    # Check expiration
    expires_at_dt = datetime.fromisoformat(session["expires_at"])
    now_dt = datetime.now(timezone.utc)
    # Ensure timezone awareness for comparison
    if expires_at_dt.tzinfo is None:
        expires_at_dt = expires_at_dt.replace(tzinfo=timezone.utc)

    if expires_at_dt < now_dt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
        )

    user = crud.get_user_by_id(session["user_id"])
    if not user or user.get("is_banned"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended.",
        )

    # Issue a new 15-minute access token
    new_access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]}
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }


@router.post(
    "/api/auth/logout",
    summary="Revoke the active session in the database and clear cookie",
)
def logout(
    request: Request,
    response: Response,
    body: Optional[RefreshTokenRequest] = None,
):
    """
    Logout: Marks the refresh token as revoked in the database and deletes the cookie.
    """
    raw_token = request.cookies.get("refresh_token")
    if not raw_token and body and body.refresh_token:
        raw_token = body.refresh_token

    if raw_token:
        token_hash = hash_token(raw_token)
        crud.revoke_user_session(token_hash)

    response.delete_cookie(key="refresh_token", path="/api/auth")
    return {"message": "Logged out successfully. Session revoked."}


@router.get(
    "/api/users/me",
    response_model=UserResponse,
    summary="Get current logged-in user profile",
)
@router.get(
    "/api/auth/me",
    response_model=UserResponse,
    include_in_schema=False,
)
def get_me(current_user: dict = Depends(get_current_user)):
    """Return profile details for the currently authenticated student."""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        is_banned=bool(current_user["is_banned"]),
        created_at=current_user["created_at"],
    )
