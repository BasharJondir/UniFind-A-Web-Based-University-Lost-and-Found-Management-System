"""
UniFind - Items & Ownership Permission Test Suite
Validates item CRUD, automatic author linkage, 403 Forbidden ownership guards, and admin overrides.
"""

from fastapi.testclient import TestClient


def test_public_item_listing_and_stats(client: TestClient):
    """Verify that campus directory items and summary metrics are publicly viewable."""
    res_items = client.get("/api/items")
    assert res_items.status_code == 200
    assert isinstance(res_items.json(), list)

    res_stats = client.get("/api/stats")
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert "total" in stats
    assert "lost" in stats
    assert "found" in stats
    assert "returned" in stats


def test_create_item_links_author(client: TestClient, student_headers: dict):
    """Verify item creation auto-links the authenticated student ID and email."""
    item_payload = {
        "title": "Calculus Textbook (9th Ed)",
        "description": "Hardcover book left on table 4B",
        "category": "Books",
        "type": "lost",
        "location": "Central Library 3rd Floor",
    }
    res = client.post("/api/items", json=item_payload, headers=student_headers)
    assert res.status_code == 201
    item = res.json()
    assert item["title"] == item_payload["title"]
    assert item["user_id"] is not None
    assert item["contact_email"] == "student@univ.edu"
    assert item["status"] == "missing"


def test_author_can_update_own_item_and_status(client: TestClient, student_headers: dict):
    """Verify that report authors can update details and resolve status."""
    # 1. Create item as student
    create_res = client.post(
        "/api/items",
        json={
            "title": "Blue Hydro Flask",
            "description": "32oz flask with university stickers",
            "category": "Personal Accessories",
            "type": "lost",
            "location": "Science Hall Room 101",
        },
        headers=student_headers,
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    # 2. Author updates description
    update_res = client.put(
        f"/api/items/{item_id}",
        json={"title": "Blue Hydro Flask (Updated)"},
        headers=student_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Blue Hydro Flask (Updated)"

    # 3. Author marks item as returned
    status_res = client.patch(
        f"/api/items/{item_id}/status",
        json={"status": "returned"},
        headers=student_headers,
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "returned"


def test_non_author_forbidden_from_editing_or_deleting(client: TestClient, student_headers: dict):
    """Safety Guard: Non-authors must receive 403 Forbidden when attempting to modify another student's report."""
    # 1. Register a second student
    client.post(
        "/api/auth/signup",
        json={"email": "student2@univ.edu", "password": "Pass123!", "full_name": "Student Two"},
    )
    login_res = client.post(
        "/api/auth/login",
        json={"email": "student2@univ.edu", "password": "Pass123!"},
    )
    student2_headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # 2. Student 2 creates an item
    create_res = client.post(
        "/api/items",
        json={
            "title": "Sony Headphones",
            "description": "Black WH-1000XM4 in case",
            "category": "Electronics",
            "type": "lost",
            "location": "Student Union Cafe",
        },
        headers=student2_headers,
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    # 3. Student 1 tries to EDIT Student 2's item -> 403 Forbidden
    edit_res = client.put(
        f"/api/items/{item_id}",
        json={"title": "Hacked Title"},
        headers=student_headers,
    )
    assert edit_res.status_code == 403
    assert "permission denied" in edit_res.json()["detail"].lower()

    # 4. Student 1 tries to CHANGE STATUS -> 403 Forbidden
    status_res = client.patch(
        f"/api/items/{item_id}/status",
        json={"status": "returned"},
        headers=student_headers,
    )
    assert status_res.status_code == 403

    # 5. Student 1 tries to DELETE -> 403 Forbidden
    delete_res = client.delete(f"/api/items/{item_id}", headers=student_headers)
    assert delete_res.status_code == 403


def test_admin_can_override_and_delete_any_item(client: TestClient, student_headers: dict, proctor_headers: dict):
    """Administrator Override: University Proctor can moderate and delete any improper campus report."""
    # Student creates an item
    create_res = client.post(
        "/api/items",
        json={
            "title": "Improper Prank Post",
            "description": "Spam report violating guidelines",
            "category": "Other",
            "type": "found",
            "location": "Unknown",
        },
        headers=student_headers,
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["id"]

    # Proctor (Admin) deletes it -> 200 OK
    delete_res = client.delete(f"/api/items/{item_id}", headers=proctor_headers)
    assert delete_res.status_code == 200

    # Ensure item no longer exists
    get_res = client.get(f"/api/items/{item_id}")
    assert get_res.status_code == 404
