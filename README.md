# UniFind — A Web-Based University Lost and Found Management System
### CSE 309 Mid Project Assessment — Minimum Viable Product (MVP)

UniFind is a centralized web platform designed for university campuses to streamline reporting, searching, managing, and reuniting lost and found belongings.

---

## 📋 Assessment Overview & Mark Distribution (30 Marks Total)

| Component | Marks | Description | Status |
|---|:---:|---|:---:|
| **Frontend Implementation** | 10 | React 19 + TypeScript, modern functional components, full 5-operation CRUD | ✅ Complete |
| **Backend Implementation** | 10 | Python + FastAPI, REST endpoints for all 5 CRUD operations, SQLite persistence | ✅ Complete |
| **GitHub Presentation & Viva** | 10 | Issue & branch workflow, DevTools network demonstration, Postman verification | ✅ Ready |

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, CSS Design System
- **Backend:** Python 3.10+, FastAPI, Pydantic v2, Uvicorn
- **Database:** SQLite (built-in, autonomous, zero external dependencies, pre-seeded demo records)
- **Deployment:** Vercel configured (`vercel.json` rewrites `/api/*` to FastAPI backend and static routes to Vite frontend)
- **API Testing:** Postman (`UniFind_API_Postman_Collection.json` included in repository)

---

## 🚀 How to Run Locally

### 1. Run the Backend (Terminal 1)

```bash
cd backend

# Create and activate virtual environment (if not already done)
python -m venv .venv
.venv\Scripts\Activate.ps1       # On Windows PowerShell
# macOS/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server with live reload
uvicorn main:app --reload --port 8000
```

- **Backend API URL:** http://localhost:8000
- **Interactive Swagger Docs:** http://localhost:8000/docs
- **ReDoc Documentation:** http://localhost:8000/redoc

### 2. Run the Frontend (Terminal 2)

```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```

- **Frontend Web App:** http://localhost:5173
- In development mode, Vite automatically proxies all `/api/*` requests to `http://localhost:8000`.

---

## 📡 REST API Reference (Complete CRUD)

| HTTP Method | Endpoint | CRUD Operation | Description |
|---|---|:---:|---|
| `POST` | `/api/items` | **CREATE** | Submit a new lost or found item report |
| `GET` | `/api/items` | **READ (List)** | Retrieve all items (supports `search`, `type`, `category`, `status` query filters) |
| `GET` | `/api/items/{id}` | **READ (Single)** | Retrieve full details of a single item by UUID |
| `PUT` | `/api/items/{id}` | **UPDATE** | Update details of an existing item report |
| `PATCH` | `/api/items/{id}/status` | **UPDATE (Status)** | Quick status toggle (`missing` / `found` / `returned`) |
| `DELETE` | `/api/items/{id}` | **DELETE** | Permanently delete an item report from the database |
| `GET` | `/api/stats` | **READ** | Get dashboard counts (total, lost, found, returned) |
| `GET` | `/api/health` | **READ** | Health check verifying backend status |

---

## 💾 Database Schema

The database is built on **SQLite** (`backend/unifind.db`), created and migrated automatically on backend startup.

### Table: `items`
| Column Name | SQL Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | UUID string identifying each report |
| `title` | `TEXT` | `NOT NULL` | Name of the item (e.g. *Navy Blue Hydro Flask*) |
| `description` | `TEXT` | `NOT NULL` | Detailed description and distinguishing marks |
| `category` | `TEXT` | `NOT NULL` | Category (*Electronics*, *Cards & IDs*, *Keys*, etc.) |
| `type` | `TEXT` | `NOT NULL` | Report type: `'lost'` or `'found'` |
| `location` | `TEXT` | `NOT NULL` | Campus location where lost/found |
| `date` | `TEXT` | `NOT NULL` | Date in `YYYY-MM-DD` ISO format |
| `contact_email`| `TEXT` | `NOT NULL` | Student contact email |
| `image_url` | `TEXT` | `NULLABLE` | Image link or photo |
| `status` | `TEXT` | `NOT NULL` | Current state: `'missing'`, `'found'`, or `'returned'` |
| `created_at` | `TEXT` | `NOT NULL` | ISO 8601 creation timestamp |
| `updated_at` | `TEXT` | `NOT NULL` | ISO 8601 last update timestamp |

---

## 🎓 Viva & Assessment Demonstration Guide

During your evaluation, you are required to demonstrate and explain **5 core aspects**:

### 1. Demonstrate Frontend CRUD
- **Create:** Click `+ Report Item` in the top right. Fill in the title, category, campus location, contact email, and description. Click **Submit Report**. Notice the instant notification and new card in the catalog.
- **Read (List):** Scroll through the cards in the catalog. Use the search bar, category filter, and type selector (*Lost Only* / *Found Only*) to filter records.
- **Read (Single):** Click on any item card or click **View**. A modal appears showing all metadata, the item's UUID, campus location, date, contact email, and description.
- **Update:** Click **Edit** on any card. Modify the title, location, or status. Click **Update Report**. Or use the **✓ Mark Returned** quick button.
- **Delete:** Click the red **🗑️ Delete** button on any card. Confirm the prompt to delete it.

### 2. Demonstrate Request Flow in Browser DevTools
- Press `F12` (or Right Click -> Inspect) and open the **Network** tab.
- Filter by `Fetch/XHR`.
- Click `+ Report Item` and create an item:
  - Show the teacher the `POST /api/items` request, status code `201 Created`, the JSON request payload in the **Payload** tab, and the created object returned in the **Response** tab.
- Click **Mark Returned**:
  - Show the `PATCH /api/items/{id}/status` request with status code `200 OK`.

### 3. Explain REST API Endpoints
- **`POST /api/items`** — Validates incoming JSON using Pydantic `ItemCreate` model and inserts into SQLite. Returns HTTP 201.
- **`GET /api/items`** — Accepts optional query parameters (`search`, `type`, `category`, `status`), builds SQL query, and returns JSON array of items.
- **`GET /api/items/{id}`** — Looks up item by UUID. Returns HTTP 200 with object, or HTTP 404 if item does not exist.
- **`PUT /api/items/{id}`** — Accepts partial/full fields using `ItemUpdate` model, updates columns, and updates `updated_at` timestamp.
- **`DELETE /api/items/{id}`** — Executes `DELETE FROM items WHERE id = ?`. Returns confirmation message or HTTP 404.

### 4. Live Postman Demonstration
1. Open Postman.
2. Click **Import** and select `UniFind_API_Postman_Collection.json` from this project's root folder.
3. All 8 requests (Health Check, Stats, Create, Read List, Read Single, Update, Patch Status, Delete) are pre-configured with sample payloads.
4. Set the environment variable `baseUrl` to `http://localhost:8000`.
5. Execute any request live to show the instructor.

### 5. Explain Database Models & Relations
- SQLite database is managed in `backend/database.py`.
- Schema is validated with Pydantic models in `backend/models.py`.
- Seed data runs automatically on startup if the database is newly initialized, guaranteeing realistic university demo records out-of-the-box.

---

## 🌐 Deploy to Vercel

1. Push your changes to your Git repository (`main` branch).
2. Go to [Vercel](https://vercel.com/new) and import the repository.
3. Keep **Root Directory** as `./` (Vercel uses `vercel.json` to deploy both frontend and backend).
4. Click **Deploy**.
