"""
UniFind - Data Access & CRUD Operations Layer
Handles direct database interactions for items, users, and authentication sessions.
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any
import uuid

try:
    from backend.database import get_connection
except ImportError:
    from database import get_connection


# ==========================================
# User & Session CRUD
# ==========================================

def create_user(
    email: str,
    full_name: str,
    password_hash: str,
    role: str = "user",
) -> Dict[str, Any]:
    """Create a new registered user in the database."""
    user_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    record = {
        "id": user_id,
        "email": email.strip().lower(),
        "full_name": full_name.strip(),
        "password_hash": password_hash,
        "role": role,
        "is_banned": 0,
        "created_at": now,
    }

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (id, email, full_name, password_hash, role, is_banned, created_at)
            VALUES (:id, :email, :full_name, :password_hash, :role, :is_banned, :created_at)
            """,
            record,
        )
        conn.commit()

    return {
        "id": user_id,
        "email": record["email"],
        "full_name": record["full_name"],
        "role": record["role"],
        "is_banned": False,
        "created_at": now,
    }


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieve user record by unique email."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        d["is_banned"] = bool(d.get("is_banned", 0))
        return d


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve user record by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        d["is_banned"] = bool(d.get("is_banned", 0))
        return d


def create_user_session(
    user_id: str,
    token_hash: str,
    expires_at: str,
) -> Dict[str, Any]:
    """Store hashed refresh token session in database."""
    session_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    record = {
        "id": session_id,
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "is_revoked": 0,
        "created_at": now,
    }

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO user_sessions (id, user_id, token_hash, expires_at, is_revoked, created_at)
            VALUES (:id, :user_id, :token_hash, :expires_at, :is_revoked, :created_at)
            """,
            record,
        )
        conn.commit()

    return record


def get_user_session(token_hash: str) -> Optional[Dict[str, Any]]:
    """Retrieve session record by token hash."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_sessions WHERE token_hash = ?", (token_hash,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        d["is_revoked"] = bool(d.get("is_revoked", 0))
        return d


def revoke_user_session(token_hash: str) -> bool:
    """Mark a refresh token session as revoked (logout)."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE user_sessions SET is_revoked = 1 WHERE token_hash = ?",
            (token_hash,),
        )
        conn.commit()
        return cursor.rowcount > 0


def revoke_all_user_sessions(user_id: str) -> bool:
    """Revoke all sessions for a user (e.g. security breach, password change)."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE user_sessions SET is_revoked = 1 WHERE user_id = ?",
            (user_id,),
        )
        conn.commit()
        return cursor.rowcount > 0


# ==========================================
# Lost & Found Items CRUD
# ==========================================

def get_all(
    search: Optional[str] = None,
    item_type: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve all items matching optional search, category, type, and status filters."""
    query = "SELECT * FROM items WHERE 1=1"
    params = []

    if item_type and item_type.lower() != "all":
        query += " AND LOWER(type) = LOWER(?)"
        params.append(item_type)

    if category and category.lower() != "all":
        query += " AND LOWER(category) = LOWER(?)"
        params.append(category)

    if status and status.lower() != "all":
        query += " AND LOWER(status) = LOWER(?)"
        params.append(status)

    if search:
        query += " AND (title LIKE ? OR description LIKE ? OR location LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard, wildcard])

    query += " ORDER BY created_at DESC"

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_by_id(item_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single item report by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def create(item_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new lost or found item report."""
    item_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    record = {
        "id": item_id,
        "title": item_data["title"],
        "description": item_data["description"],
        "category": item_data["category"],
        "type": item_data["type"].lower(),
        "location": item_data["location"],
        "date": item_data.get("date") or date.today().isoformat(),
        "contact_email": item_data["contact_email"],
        "image_url": item_data.get("image_url") or "",
        "status": item_data.get("status", "missing" if item_data["type"].lower() == "lost" else "found"),
        "user_id": item_data.get("user_id"),
        "created_at": now,
        "updated_at": now,
    }

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO items (
                id, title, description, category, type, location,
                date, contact_email, image_url, status, user_id, created_at, updated_at
            ) VALUES (
                :id, :title, :description, :category, :type, :location,
                :date, :contact_email, :image_url, :status, :user_id, :created_at, :updated_at
            )
            """,
            record,
        )
        conn.commit()

    return record


def update(item_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update fields of an existing item report."""
    existing = get_by_id(item_id)
    if not existing:
        return None

    fields_to_update = {}
    for key in [
        "title",
        "description",
        "category",
        "type",
        "location",
        "date",
        "contact_email",
        "image_url",
        "status",
        "user_id",
    ]:
        if key in update_data and update_data[key] is not None:
            fields_to_update[key] = update_data[key]

    fields_to_update["updated_at"] = datetime.now().isoformat()

    set_clause = ", ".join([f"{k} = ?" for k in fields_to_update.keys()])
    params = list(fields_to_update.values())
    params.append(item_id)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE items SET {set_clause} WHERE id = ?", params)
        conn.commit()

    return get_by_id(item_id)


def delete(item_id: str) -> bool:
    """Delete an item report by ID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
        conn.commit()
        return cursor.rowcount > 0


def get_stats() -> Dict[str, int]:
    """Calculate dashboard summary statistics."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM items")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM items WHERE LOWER(type) = 'lost'")
        lost = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM items WHERE LOWER(type) = 'found'")
        found = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM items WHERE LOWER(status) = 'returned'")
        returned = cursor.fetchone()[0]

        return {
            "total": total,
            "lost": lost,
            "found": found,
            "returned": returned,
        }


# Aliases for backward compatibility
db_get_all = get_all
db_get_by_id = get_by_id
db_create = create
db_update = update
db_delete = delete
db_get_stats = get_stats
