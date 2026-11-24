"""
UniFind - RBAC, Safety Guards & Admin Hierarchy Test Suite
Validates role gating (403), Course Safety Guards, Main Admin supreme authority, and instant revocation.
"""

from fastapi.testclient import TestClient


def test_student_blocked_from_admin_endpoints(client: TestClient, student_headers: dict):
    """Safety Gating: Students must be blocked with 403 Forbidden from all /api/admin endpoints."""
    assert client.get("/api/admin/check", headers=student_headers).status_code == 403
    assert client.get("/api/admin/users", headers=student_headers).status_code == 403
    assert client.get("/api/admin/stats", headers=student_headers).status_code == 403


def test_admin_can_access_portal_and_stats(client: TestClient, proctor_headers: dict):
    """Verify administrator authorization on management and metrics endpoints."""
    check_res = client.get("/api/admin/check", headers=proctor_headers)
    assert check_res.status_code == 200
    assert check_res.json()["role"] == "admin"

    users_res = client.get("/api/admin/users", headers=proctor_headers)
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 2

    stats_res = client.get("/api/admin/stats", headers=proctor_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_users" in stats
    assert "banned_users" in stats


def test_main_admin_hierarchy_and_proctor_immunity(
    client: TestClient, proctor_headers: dict, second_admin_headers: dict
):
    """
    Hierarchy & Safety Guard 1:
    - University Proctor (Main Admin) has full access to ban/unban sub-admins.
    - Second Admin CANNOT ban or demote University Proctor.
    """
    # Get user profiles
    users = client.get("/api/admin/users", headers=proctor_headers).json()
    proctor = next(u for u in users if u["email"] == "admin@univ.edu")
    second_admin = next(u for u in users if u["email"] == "admin2@univ.edu")

    # 1. Second Admin tries to ban University Proctor -> 400 Bad Request
    hostile_ban = client.patch(
        f"/api/admin/users/{proctor['id']}/ban",
        json={"is_banned": True, "reason": "Hostile takeover"},
        headers=second_admin_headers,
    )
    assert hostile_ban.status_code == 400
    assert "University Proctor is the Main Administrator and cannot be banned" in hostile_ban.json()["detail"]

    # 2. Second Admin tries to demote University Proctor -> 400 Bad Request
    hostile_demote = client.patch(
        f"/api/admin/users/{proctor['id']}/role",
        json={"role": "user"},
        headers=second_admin_headers,
    )
    assert hostile_demote.status_code == 400
    assert "cannot be demoted" in hostile_demote.json()["detail"]

    # 3. University Proctor (Main Admin) CAN suspend Second Admin -> 200 OK
    proctor_ban = client.patch(
        f"/api/admin/users/{second_admin['id']}/ban",
        json={"is_banned": True, "reason": "Administrative suspension"},
        headers=proctor_headers,
    )
    assert proctor_ban.status_code == 200
    assert proctor_ban.json()["is_banned"] is True

    # 4. University Proctor restores Second Admin -> 200 OK
    proctor_unban = client.patch(
        f"/api/admin/users/{second_admin['id']}/ban",
        json={"is_banned": False},
        headers=proctor_headers,
    )
    assert proctor_unban.status_code == 200
    assert proctor_unban.json()["is_banned"] is False


def test_safety_guard_2_self_demotion_lock(client: TestClient, second_admin_headers: dict):
    """Safety Guard 2: An administrator cannot demote their own account to prevent lockouts."""
    me = client.get("/api/users/me", headers=second_admin_headers).json()
    self_demote = client.patch(
        f"/api/admin/users/{me['id']}/role",
        json={"role": "user"},
        headers=second_admin_headers,
    )
    assert self_demote.status_code == 400
    assert "You cannot demote or remove your own administrator privileges" in self_demote.json()["detail"]


def test_safety_guard_3_instant_session_revocation(client: TestClient, proctor_headers: dict):
    """
    Safety Guard 3:
    When a student account is suspended, all active sessions are revoked,
    and subsequent API requests with existing tokens are immediately blocked (403).
    """
    # 1. Register and login a student account
    spammer_email = "testspammer@univ.edu"
    client.post(
        "/api/auth/signup",
        json={"email": spammer_email, "password": "Pass123!", "full_name": "Test Spammer"},
    )
    login_res = client.post(
        "/api/auth/login",
        json={"email": spammer_email, "password": "Pass123!"},
    )
    assert login_res.status_code == 200
    spammer_id = login_res.json()["user"]["id"]
    spammer_token = login_res.json()["access_token"]
    spammer_headers = {"Authorization": f"Bearer {spammer_token}"}

    # Verify student can initially access profile
    assert client.get("/api/users/me", headers=spammer_headers).status_code == 200

    # 2. Proctor suspends student with audit reason
    ban_res = client.patch(
        f"/api/admin/users/{spammer_id}/ban",
        json={"is_banned": True, "reason": "Automated spam reports"},
        headers=proctor_headers,
    )
    assert ban_res.status_code == 200
    assert ban_res.json()["is_banned"] is True
    assert ban_res.json()["ban_reason"] == "Automated spam reports"

    # 3. Existing JWT token must now immediately fail with 403 Forbidden
    assert client.get("/api/users/me", headers=spammer_headers).status_code == 403

    # 4. New login attempt must also be rejected with 403 Forbidden
    relogin_res = client.post(
        "/api/auth/login",
        json={"email": spammer_email, "password": "Pass123!"},
    )
    assert relogin_res.status_code == 403
    assert "suspended by an administrator" in relogin_res.json()["detail"].lower()

    # 5. Proctor unbans student -> access restored
    unban_res = client.patch(
        f"/api/admin/users/{spammer_id}/ban",
        json={"is_banned": False},
        headers=proctor_headers,
    )
    assert unban_res.status_code == 200
    assert unban_res.json()["is_banned"] is False

    # Student can log in again
    restored_login = client.post(
        "/api/auth/login",
        json={"email": spammer_email, "password": "Pass123!"},
    )
    assert restored_login.status_code == 200
