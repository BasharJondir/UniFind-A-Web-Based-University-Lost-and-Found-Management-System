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
    """Create items table if it doesn't exist and seed sample data if empty."""
    with get_connection() as conn:
        cursor = conn.cursor()
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
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            """
        )
        conn.commit()

        # Check if table has data; if not, seed realistic university records
        cursor.execute("SELECT COUNT(*) FROM items")
        count = cursor.fetchone()[0]
        if count == 0:
            seed_demo_data(cursor)
            conn.commit()


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
            datetime.now().isoformat(),
            datetime.now().isoformat(),
        ),
    ]

    cursor.executemany(
        """
        INSERT INTO items (
            id, title, description, category, type, location,
            date, contact_email, image_url, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
