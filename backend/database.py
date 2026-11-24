"""
Database management for UniFind using SQLite.
Includes automatic table creation, realistic university demo data seeding,
and full compatibility with read-only serverless cloud environments like Vercel.
"""

import os
import shutil
import sqlite3
import tempfile
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Optional, List, Dict, Any


def get_db_path() -> Path:
    """
    Returns a writable database path.
    On Vercel and serverless clouds, the application code directory is read-only.
    The only writable directory is tempfile.gettempdir() (e.g. /tmp on Linux/Vercel).
    """
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        temp_dir = Path(tempfile.gettempdir())
        tmp_db = temp_dir / "unifind.db"
        local_db = Path(__file__).resolve().parent / "unifind.db"
        if local_db.exists() and not tmp_db.exists():
            try:
                shutil.copyfile(local_db, tmp_db)
            except Exception:
                pass
        return tmp_db

    # Local development
    return Path(__file__).resolve().parent / "unifind.db"


def get_connection() -> sqlite3.Connection:
    """Provides a SQLite connection with Row factory."""
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.OperationalError:
        # Fallback to temp directory if local path is not writable
        tmp_db = Path(tempfile.gettempdir()) / "unifind.db"
        conn = sqlite3.connect(tmp_db)
        conn.row_factory = sqlite3.Row
        return conn


def init_db():
    """Create tables (items, users, user_sessions) and seed initial demo data."""
    with get_connection() as conn:
        cursor = conn.cursor()

        # 1. Items Table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL, -- 'lost' or 'found'
                location TEXT NOT NULL,
                date TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                image_url TEXT,
                status TEXT NOT NULL, -- 'missing', 'found', 'returned'
                user_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )

        # Ensure user_id column exists on older items table
        cursor.execute("PRAGMA table_info(items)")
        columns = [col[1] for col in cursor.fetchall()]
        if "user_id" not in columns:
            cursor.execute("ALTER TABLE items ADD COLUMN user_id TEXT")

        # 2. Users Table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                is_banned INTEGER NOT NULL DEFAULT 0,
                ban_reason TEXT,
                created_at TEXT NOT NULL
            );
            """
        )

        # Ensure ban_reason column exists on users table
        cursor.execute("PRAGMA table_info(users)")
        user_columns = [col[1] for col in cursor.fetchall()]
        if "ban_reason" not in user_columns:
            cursor.execute("ALTER TABLE users ADD COLUMN ban_reason TEXT")

        # 3. User Sessions / Refresh Tokens Table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token_hash TEXT UNIQUE NOT NULL,
                expires_at TEXT NOT NULL,
                is_revoked INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """
        )
        conn.commit()

        # Check if users table has data; if not, seed default admin & student
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        if user_count == 0:
            seed_demo_users(cursor)
            conn.commit()

        # Check if items table has data; if not, seed realistic university records
        cursor.execute("SELECT COUNT(*) FROM items")
        count = cursor.fetchone()[0]
        if count == 0:
            seed_demo_data(cursor)
            conn.commit()


def seed_demo_users(cursor: sqlite3.Cursor):
    """Seed initial demo admin and student accounts."""
    try:
        from backend.auth import hash_password
    except ImportError:
        from auth import hash_password

    now = datetime.now().isoformat()
    # Password for both: Pass123!
    default_pw_hash = hash_password("Pass123!")

    demo_users = [
        (
            str(uuid.uuid4()),
            "admin@univ.edu",
            "University Proctor",
            default_pw_hash,
            "admin",
            0,
            now,
        ),
        (
            str(uuid.uuid4()),
            "student@univ.edu",
            "Bashar Jondir",
            default_pw_hash,
            "user",
            0,
            now,
        ),
    ]

    cursor.executemany(
        """
        INSERT INTO users (id, email, full_name, password_hash, role, is_banned, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        demo_users,
    )


def seed_demo_data(cursor: sqlite3.Cursor):
    """Seed realistic lost & found records for university students."""
    sample_items = [
        (
            str(uuid.uuid4()),
            "Navy Blue Hydro Flask",
            "Left in Room 302 after CSE309 lecture. Has university stickers on the side.",
            "Personal Belongings",
            "lost",
            "Academic Building 2, Room 302",
            date.today().isoformat(),
            "student1@univ.edu",
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60",
            "missing",
            None,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
        ),
        (
            str(uuid.uuid4()),
            "Student ID Card - CSE Department",
            "Found on table 4 at the main cafeteria around 1:30 PM. Name starts with R.",
            "Cards & IDs",
            "found",
            "Main Cafeteria, Table 4",
            date.today().isoformat(),
            "cafeteria-staff@univ.edu",
            "https://images.unsplash.com/photo-1578874691223-a49267429148?w=500&auto=format&fit=crop&q=60",
            "found",
            None,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
        ),
        (
            str(uuid.uuid4()),
            "Black Leather Bi-Fold Wallet",
            "Contained library pass and metro card. Lost somewhere near the 3rd floor library stacks.",
            "Personal Belongings",
            "lost",
            "Central Library, 3rd Floor",
            date.today().isoformat(),
            "bashar@univ.edu",
            "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=60",
            "missing",
            None,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
        ),
        (
            str(uuid.uuid4()),
            "Apple AirPods Pro (2nd Gen)",
            "Found in white charging case on desk in Lab 4. Inscribed with initials 'AK'.",
            "Electronics",
            "found",
            "Computer Lab 4",
            date.today().isoformat(),
            "lab-assistant@univ.edu",
            "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=60",
            "found",
            None,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
        ),
        (
            str(uuid.uuid4()),
            "Calculus: Early Transcendentals Textbook",
            "Hardcover textbook left on bench near auditorium entrance.",
            "Books & Study Materials",
            "found",
            "Auditorium Entrance Bench",
            date.today().isoformat(),
            "guard-desk@univ.edu",
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
            "returned",
            None,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
        ),
        (
            str(uuid.uuid4()),
            "Set of Dorm Keys with Red Lanyard",
            "Three silver keys on a red lanyard with NSU logo. Misplaced near campus gym.",
            "Keys",
            "lost",
            "Campus Gymnasium / Sports Complex",
            date.today().isoformat(),
            "tanvir@univ.edu",
            "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&auto=format&fit=crop&q=60",
            "returned",
            None,
            datetime.now().isoformat(),
            datetime.now().isoformat(),
        ),
    ]

    cursor.executemany(
        """
        INSERT INTO items (
            id, title, description, category, type, location,
            date, contact_email, image_url, status, user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        sample_items,
    )


# Forward CRUD functions from crud.py for backward compatibility
try:
    from backend.crud import (
        get_all as db_get_all,
        get_by_id as db_get_by_id,
        create as db_create,
        update as db_update,
        delete as db_delete,
        get_stats as db_get_stats,
    )
except ImportError:
    from crud import (
        get_all as db_get_all,
        get_by_id as db_get_by_id,
        create as db_create,
        update as db_update,
        delete as db_delete,
        get_stats as db_get_stats,
    )
