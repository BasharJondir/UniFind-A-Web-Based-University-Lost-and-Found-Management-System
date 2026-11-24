"""
UniFind - Test Configuration and Fixtures
Provides isolated database initialization and authenticated API clients for pytest.
"""

import os
import tempfile
from pathlib import Path
from typing import Generator, Dict, Any

import pytest
from fastapi.testclient import TestClient

# Configure isolated SQLite database for the test session
_test_db_file = tempfile.NamedTemporaryFile(suffix="_unifind_test.db", delete=False)
_test_db_path = _test_db_file.name
_test_db_file.close()

os.environ["UNIFIND_DB_PATH"] = _test_db_path

from backend.main import app
from backend.database import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Initializes the database schema and demo seed data once for the test session."""
    init_db()
    yield
    # Cleanup test database file after session
    try:
        if os.path.exists(_test_db_path):
            os.remove(_test_db_path)
    except Exception:
        pass


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """Provides a fresh FastAPI TestClient instance."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def proctor_headers(client: TestClient) -> Dict[str, str]:
    """Logs in as University Proctor (Main Administrator) and returns Authorization headers."""
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@univ.edu", "password": "Pass123!"},
    )
    assert res.status_code == 200, f"Proctor login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def student_headers(client: TestClient) -> Dict[str, str]:
    """Logs in as Bashar Jondir (Primary Student) and returns Authorization headers."""
    res = client.post(
        "/api/auth/login",
        json={"email": "student@univ.edu", "password": "Pass123!"},
    )
    assert res.status_code == 200, f"Student login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def second_admin_headers(client: TestClient, proctor_headers: Dict[str, str]) -> Dict[str, str]:
    """Ensures a second admin exists, logs in, and returns Authorization headers."""
    email = "admin2@univ.edu"
    password = "password123"

    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    if login_res.status_code != 200:
        # Create second admin account
        signup_res = client.post(
            "/api/auth/signup",
            json={
                "email": email,
                "password": password,
                "full_name": "Second Admin",
                "role": "admin",
            },
        )
        assert signup_res.status_code == 201, f"Failed to create second admin: {signup_res.text}"
        login_res = client.post("/api/auth/login", json={"email": email, "password": password})

    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
