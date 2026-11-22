"""
UniFind - Authentication & Token Utility Module
Handles password hashing, JWT generation, and SHA-256 refresh token hashing.
"""

from datetime import datetime, timedelta, timezone
import hashlib
import os
import secrets
from typing import Optional, Dict, Any

import bcrypt
import jwt

# Secret key for signing JWTs (read from environment, with secure fallback)
JWT_SECRET_KEY = os.environ.get(
    "JWT_SECRET_KEY",
    "unifind-super-secret-jwt-key-cse309-autumn-2026-production-ready-32bytes",
)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def hash_token(token: str) -> str:
    """
    Hash a refresh token using SHA-256.
    Stores hashes in database to prevent token leakage even if DB is compromised.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_refresh_token() -> str:
    """Generate a high-entropy cryptographically random token."""
    return secrets.token_urlsafe(48)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Generate a short-lived JWT access token (15-minute default).
    Payload includes user id, email, and role.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
