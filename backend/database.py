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
    Supports UNIFIND_DB_PATH override for isolated testing.
    On Vercel and serverless clouds, the application code directory is read-only.
    The only writable directory is tempfile.gettempdir() (e.g. /tmp on Linux/Vercel).
    """
    if os.environ.get("UNIFIND_DB_PATH"):
        return Path(os.environ["UNIFIND_DB_PATH"])

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


class DictRow(dict):
    """Row object that supports both dictionary key access ('col') and tuple index access (0)."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._values = list(self.values())

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return super().__getitem__(key)


class PostgresCursorWrapper:
    """Wraps psycopg2 cursor to translate SQLite '?' and ':named' parameter placeholders to PostgreSQL '%s' and '%(name)s'."""
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query: str, params: Any = None):
        import re
        if params is not None:
            if isinstance(params, dict):
                query = re.sub(r':([a-zA-Z0-9_]+)', r'%(\1)s', query)
            elif "?" in query:
                query = query.replace("?", "%s")
            return self._cursor.execute(query, params)
        return self._cursor.execute(query)

    def executemany(self, query: str, seq_of_params: Any):
        import re
        if seq_of_params and len(seq_of_params) > 0 and isinstance(seq_of_params[0], dict):
            query = re.sub(r':([a-zA-Z0-9_]+)', r'%(\1)s', query)
        elif "?" in query:
            query = query.replace("?", "%s")
        return self._cursor.executemany(query, seq_of_params)

    def fetchone(self):
        row = self._cursor.fetchone()
        return DictRow(row) if row is not None else None

    def fetchall(self):
        rows = self._cursor.fetchall()
        return [DictRow(r) for r in rows]

    @property
    def rowcount(self):
        return self._cursor.rowcount

    def close(self):
        self._cursor.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class PostgresConnectionWrapper:
    """Wraps psycopg2 connection to provide uniform context manager interface matching sqlite3."""
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return PostgresCursorWrapper(self._conn.cursor())

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()
        self.close()


def get_connection():
    """
    Dual-mode Database Connection:
    1. If DATABASE_URL or SUPABASE_DATABASE_URL is set, connects to live Supabase PostgreSQL.
    2. Otherwise, defaults to local SQLite (unifind.db) for offline development and isolated testing.
    """
    db_url = os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DATABASE_URL")
    if db_url and db_url.startswith("postgres"):
        try:
            import psycopg2
            import psycopg2.extras

            # Fix sqlalchemy or postgres:// URL scheme to postgresql://
            if db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql://", 1)

            if "sslmode=" not in db_url:
                separator = "&" if "?" in db_url else "?"
                db_url = f"{db_url}{separator}sslmode=require"

            raw_conn = psycopg2.connect(
                db_url,
                cursor_factory=psycopg2.extras.RealDictCursor,
                connect_timeout=10,
            )
            return PostgresConnectionWrapper(raw_conn)
        except Exception as e:
            # Fallback to local SQLite if remote PostgreSQL is unreachable
            pass

    # Default to SQLite
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
