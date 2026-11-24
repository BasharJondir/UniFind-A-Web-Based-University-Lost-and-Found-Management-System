"""
UniFind - Authentication & Session Test Suite
Validates registration, bcrypt hashing, JWT issuance, refresh rotation, and session logout.
"""

from fastapi.testclient import TestClient


def test_demo_accounts_seeded(client: TestClient):
    """Verify default demo accounts are seeded and accessible."""
    # Test Student (Bashar Jondir)
    res = client.post("/api/auth/login", json={"email": "student@univ.edu", "password": "Pass123!"})
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["full_name"] == "Bashar Jondir"
    assert data["user"]["role"] == "user"
    assert "access_token" in data

    # Test Admin (University Proctor)
    res = client.post("/api/auth/login", json={"email": "admin@univ.edu", "password": "Pass123!"})
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["full_name"] == "University Proctor"
    assert data["user"]["role"] == "admin"


def test_user_signup_and_duplicate_rejection(client: TestClient):
    """Test user registration and prevent duplicate email registrations."""
    new_email = "newstudent@univ.edu"
    signup_payload = {
        "email": new_email,
        "password": "SecurePassword123!",
        "full_name": "New Student",
    }

    # 1. Valid signup
    res = client.post("/api/auth/signup", json=signup_payload)
    assert res.status_code == 201
    user = res.json()
    assert user["email"] == new_email
    assert user["full_name"] == "New Student"
    assert user["role"] == "user"
    assert "password_hash" not in user  # Ensure hash is never leaked

    # 2. Duplicate signup rejected
    res_dup = client.post("/api/auth/signup", json=signup_payload)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"].lower()


def test_login_invalid_credentials(client: TestClient):
    """Test login rejection on wrong password or unregistered email."""
    res_wrong_pw = client.post(
        "/api/auth/login",
        json={"email": "student@univ.edu", "password": "WrongPassword!"},
    )
    assert res_wrong_pw.status_code == 401
    assert "invalid email or password" in res_wrong_pw.json()["detail"].lower()

    res_unknown = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@univ.edu", "password": "AnyPassword123!"},
    )
    assert res_unknown.status_code == 401


def test_get_me_profile_authenticated(client: TestClient, student_headers: dict):
    """Verify /api/users/me returns authenticated student profile."""
    res = client.get("/api/users/me", headers=student_headers)
    assert res.status_code == 200
    profile = res.json()
    assert profile["email"] == "student@univ.edu"
    assert profile["full_name"] == "Bashar Jondir"


def test_protected_routes_reject_missing_token(client: TestClient):
    """Verify protected endpoints reject unauthenticated requests with 401."""
    res = client.get("/api/users/me")
    assert res.status_code == 401

    res_fake_token = client.get(
        "/api/users/me",
        headers={"Authorization": "Bearer invalid_or_expired_jwt_token"},
    )
    assert res_fake_token.status_code == 401


def test_refresh_token_and_logout_revocation(client: TestClient):
    """Test refresh token exchange and session termination on logout."""
    # 1. Login to get cookies
    login_res = client.post(
        "/api/auth/login",
        json={"email": "student@univ.edu", "password": "Pass123!"},
    )
    assert login_res.status_code == 200
    cookies = login_res.cookies

    # 2. Use refresh endpoint to obtain new access token
    refresh_res = client.post("/api/auth/refresh", cookies=cookies)
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()

    # 3. Logout to revoke session
    logout_res = client.post("/api/auth/logout", cookies=cookies)
    assert logout_res.status_code == 200

    # 4. Attempting to refresh with the revoked session must fail (401)
    revoked_refresh = client.post("/api/auth/refresh", cookies=cookies)
    assert revoked_refresh.status_code == 401
