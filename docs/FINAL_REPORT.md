# Independent University, Bangladesh
### Department of Computer Science & Engineering
### CSE309: Web Application & Internet

---

# Final Project Submission Report

**Project Title:** UniFind — A Web-Based University Lost and Found Management System  
**Vercel Live URL:** [https://2230470.vercel.app](https://2230470.vercel.app)  
**GitHub Repository:** [https://github.com/BasharJondir/UniFind-A-Web-Based-University-Lost-and-Found-Management-System](https://github.com/BasharJondir/UniFind-A-Web-Based-University-Lost-and-Found-Management-System)  
**API Documentation:** [https://2230470.vercel.app/docs](https://2230470.vercel.app/docs)  

**Submitted By:**  
- **Name:** Md. Abul Bashar  
- **Student ID:** 2230470  
- **Section:** 06  

**Submitted To:**  
- **Sayef Reyadh**  
- Adjunct Lecturer, Department of Computer Science & Engineering  
- Independent University, Bangladesh  

**Semester:** Autumn 2026  
**Date of Submission:** 27-11-2026  

---

## Table of Contents
1. **Executive Summary**
   - 1.1 Project Overview
   - 1.2 What Was Built Since the Mid Assessment
   - 1.3 Live Links
2. **Part A. Product Requirements Document (PRD)**
   - A1. Problem Statement
   - A2. Users and Roles
   - A3. Goals and Success Measures
   - A4. Scope and Non-Goals
   - A5. User Stories
3. **Part B. Software Requirements Specification (SRS)**
   - B1. Introduction & Definitions
   - B2. Functional Requirements (FR-AUTH, FR-RBAC, FR-ADM, FR-DOMAIN)
   - B3. Non-Functional Requirements
   - B4. Roles and Permission Matrix
   - B5. Use Cases
   - B6. Acceptance Criteria (Given-When-Then)
   - B7. Traceability Matrix
4. **Part C. Technical Design Document (TDD)**
   - C1. Technology Stack
   - C2. System Architecture
   - C3. Backend and Frontend Structure
   - C4. Data Model & Database Schema
   - C5. REST API Design
   - C6. JWT Authentication & Session Lifecycle Design
   - C7. RBAC & Security Guard Architecture
   - C8. Admin Dashboard Design
   - C9. Security Design, Threat Modeling & Mitigations
   - C10. Deployment Configuration on Vercel
   - C11. Automated Testing Strategy & Pytest Results
5. **Part D. Evidence: Screenshots of the Running Application**
   - D1. User Side (S1 – S6)
   - D2. Security Behaviour (S7 – S9)
   - D3. Admin Dashboard (S10 – S17)
   - D4. Deployment (S18 – S20)
   - D5. Tests Output (S21)
6. **Part E. Project Management and Conclusion**
   - E1. How to Run and Test
   - E2. GitHub Work Breakdown
   - E3. Known Limitations
   - E4. Future Work
   - E5. Sources, Libraries, and Tools
7. **Appendix: Demo Test Accounts and Video Demonstration**

---

## List of Tables
- **Table 1:** System Live Links
- **Table 2:** User Personas and System Roles
- **Table 3:** Core Goals and Measurable Success Metrics
- **Table 4:** End-to-End User Stories
- **Table 5:** Functional Requirements — Authentication (`FR-AUTH`)
- **Table 6:** Functional Requirements — Role-Based Access Control (`FR-RBAC`)
- **Table 7:** Functional Requirements — Administrative Governance (`FR-ADM`)
- **Table 8:** Functional Requirements — Lost & Found Domain Resource (`FR-DOMAIN`)
- **Table 9:** Non-Functional Requirements
- **Table 10:** Endpoint Access by Role Matrix
- **Table 11:** Item Ownership & Action Matrix
- **Table 12:** Administrative Safety Constraints & Governance Rules
- **Table 13:** System Use Case Specifications
- **Table 14:** Given-When-Then Acceptance Criteria
- **Table 15:** Requirements Traceability Matrix
- **Table 16:** Production Technology Stack
- **Table 17:** Database Schema Definitions (`users`, `items`, `user_sessions`)
- **Table 18:** Comprehensive API Endpoint Registry
- **Table 19:** JWT Token Claims and Structure
- **Table 20:** Security Threat Model & Applied Countermeasures
- **Table 21:** Production Environment Variables Configuration
- **Table 22:** Pytest Test Suite Execution Results (16/16 Pass)
- **Table 23:** GitHub Pull Requests and Milestones
- **Table 24:** External Libraries, Frameworks, and Tools Utilized

---

## List of Figures
- **Figure 1:** UniFind High-Level Request & Component Hierarchy
- **Figure 2:** End-to-End System Architecture (Browser, Vercel Serverless, Supabase Cloud)
- **Figure 3:** Entity-Relationship (ER) Diagram
- **Figure 4:** JWT Authentication, Silent Refresh, and Revocation Sequence Flow
- **Figure 5:** Reusable RBAC Permission Gating & Author Ownership Verification Pipeline

---

# 1. Executive Summary

### 1.1 Project Overview
**UniFind** is a modern, responsive university lost-and-found management platform developed specifically for university campuses. Belongings such as student identity cards, electronic gadgets, books, and wallets are frequently misplaced across lecture halls, cafeterias, and libraries. Traditional bulletin boards and unmoderated social media channels lead to spam, lack ownership accountability, and expose student contact information to unauthorized third parties. 

UniFind resolves this by providing an authenticated, role-gated platform where students can report lost or found belongings, search and filter campus catalogs by category and location, contact finders, and track item recovery. University proctors and administrators maintain a dedicated governance dashboard with real-time analytics, user moderation, role assignments, and audit trails.

**One-Line Stack:** React 19 with TypeScript (Vite) + Python FastAPI + Dual-Mode Engine (Supabase Cloud PostgreSQL & SQLite) + Vercel Full-Stack Serverless Deployment.

---

### 1.2 What Was Built Since the Mid Assessment
Since the mid-term MVP assessment, UniFind has transitioned from a basic unauthenticated CRUD prototype into an enterprise-grade, full-stack university application across 7 structured development phases:
- **JWT Authentication with Refresh & Logout:** Implemented 12-round `bcrypt` password hashing, short-lived 15-minute JWT access tokens (`HS256`), and 7-day SHA-256 hashed refresh tokens persisted in the database and delivered via secure `HttpOnly` cookies.
- **Role-Based Access Control & Ownership Linkage:** Developed strict server-side author auto-binding (`user_id` linkage) that rejects unauthorized item modifications with `403 Forbidden`, alongside campus safety guards (Proctor Immunity, Self-Demotion Locks, and Peer-Ban protections).
- **Admin Governance Dashboard:** Designed a dedicated control panel featuring real-time statistics cards (`/api/admin/stats`), a user directory with live role promotion/demotion, audit-backed account suspension, and item oversight.
- **Instant Session Revocation:** Created instant session termination (`is_revoked = TRUE`) ensuring that when a malicious account is banned, all active refresh tokens are immediately invalidated.
- **Modularized FastAPI Architecture:** Decoupled monolithic routes into structured routers (`backend/routers/` for auth, items, admin, system) with live interactive OpenAPI/Swagger UI at `/docs`.
- **Cloud Database Integration (Supabase PostgreSQL):** Engineered a dual-mode database driver in `backend/database.py` connecting to Supabase Cloud PostgreSQL in Tokyo via transaction pooling (`port 6543`), featuring automatic parameter translation (`?` to `%s`) and local SQLite fallback.
- **Automated Regression Suite:** Built an automated 16-test `pytest` suite verifying auth flows, token life cycles, ownership rules, and administrative safety guards.

---

### 1.3 Live Links
#### Table 1: System Live Links
| Resource | URL | Description |
| :--- | :--- | :--- |
| **Vercel Production App** | `https://2230470.vercel.app` | Live frontend accessible to campus students and administrators. |
| **Interactive API Docs (Swagger UI)** | `https://2230470.vercel.app/docs` | Live OpenAPI documentation and endpoint testing harness. |
| **Alternative API Docs (ReDoc)** | `https://2230470.vercel.app/redoc` | Structured technical API reference documentation. |
| **GitHub Repository** | `https://github.com/BasharJondir/UniFind-A-Web-Based-University-Lost-and-Found-Management-System` | Complete codebase, commit history, issues, and pull requests. |
| **Video Demonstration** | *(Added in PDF Appendix)* | 5–8 minute video walkthrough of authentication, catalog, and admin panel. |

---

# Part A. Product Requirements Document (PRD)

### A1. Problem Statement
In higher education institutions such as Independent University, Bangladesh (IUB), thousands of students, faculty, and administrative staff move between multi-story academic buildings, labs, cafeterias, and libraries daily. Misplacing critical personal items—such as student ID cards, expensive scientific calculators, laptops, textbooks, and keys—is a daily occurrence.

Currently, universities cope using fragmented, manual methods:
1. Physical inquiry desks in proctor offices that operate only during strict business hours.
2. Unofficial social media groups (e.g., Facebook student groups) where posts quickly get buried, fake claims are rampant, and personal phone numbers are exposed publicly.
3. Physical paper notices pasted across bulletin boards that lack real-time status updates once an item is claimed.

This fragmentation leads to low recovery rates, academic disruption, and student identity theft. UniFind provides an authenticated, automated university system that maintains verified ownership, rapid searchability, and proctor oversight.

---

### A2. Users and Roles
#### Table 2: User Personas and System Roles
| Role | Who They Are | Main Tasks | What They Must NEVER Be Able To Do |
| :--- | :--- | :--- | :--- |
| **Visitor (Guest)** | Unauthenticated students or guests browsing campus notices. | Browse public lost and found listings, execute keyword searches, filter by category/location, view item details. | Post new reports, edit/delete any existing report, claim items, access administrative dashboard, access student contact emails. |
| **Student (User)** | Registered university student with a verified account. | Report lost or found items, update/edit their own submissions, mark their items as "returned", view their personal submissions. | Edit, update status, or delete reports submitted by other students; access the `/api/admin/*` endpoints; ban users or promote accounts. |
| **Second Admin** | Departmental proctor assistants or campus security staff. | Moderate reported items, view system analytics, ban malicious/spammer students with documented audit reasons. | Ban or demote the Main Admin (University Proctor); demote their own account; bypass ownership verification outside admin routes. |
| **Main Admin** | University Proctor (`admin@univ.edu`). | Full administrative authority: oversee campus stats, manage user roles, ban second admins or abusive users, moderate all items. | Cannot be banned, demoted, or deleted by any user or sub-admin in the system (hard-coded system immunity). |

---

### A3. Goals and Success Measures
#### Table 3: Core Goals and Measurable Success Metrics
| Goal ID | Objective | Measurable Success Target | Metric Verification Method |
| :--- | :--- | :--- | :--- |
| **G-01** | Sub-Second Public Catalog Retrieval | Average API response time under **200 ms** for item search and filtering. | Measured via Chrome DevTools Network timing and Vercel analytics. |
| **G-02** | Strict Author Ownership Integrity | **100% rejection** (HTTP 403 Forbidden) when a student attempts to update or delete another student's report. | Automated in `test_non_author_forbidden_from_editing_or_deleting`. |
| **G-03** | Secure Session & Token Lifecycle | Access tokens expire in **15 minutes**; refresh tokens persist for **7 days** with instant session revocation upon ban. | Verified via `test_refresh_token_and_logout_revocation` and `test_safety_guard_3_instant_session_revocation`. |
| **G-04** | Administrative Immunity & Lockout Prevention | **Zero possibility** of locking out the university proctor or deleting all admins. | Verified via `test_main_admin_hierarchy_and_proctor_immunity` and `test_safety_guard_2_self_demotion_lock`. |
| **G-05** | Production High Availability & Data Persistence | Serverless backend operational with **zero data loss** across container recycles. | Verified via live Supabase Cloud PostgreSQL Tokyo pooler queries. |

---

### A4. Scope and Non-Goals
#### In-Scope:
- **Authentication & Security:** User registration, bcrypt password hashing, JWT access token generation, SHA-256 hashed refresh token session tracking, secure HttpOnly cookie issuance, and logout revocation.
- **Item Lifecycle Management (CRUD):** Reporting lost/found items with category, campus location, and date; editing reports; status toggling (`missing` to `returned`); item deletion.
- **Search & Filter:** Dynamic full-text search across titles, descriptions, and locations; filtering by item type (`lost`, `found`) and category.
- **Admin Governance Panel:** Dedicated analytics view, user directory, role assignment, audit ban system, and item moderation.
- **Course Safety Guards:** Self-demotion lock, peer ban protection, proctor immunity, and instant session revocation.
- **Deployment:** Vercel full-stack serverless deployment with dual-mode database engine (Supabase PostgreSQL + SQLite).

#### Out-of-Scope (Non-Goals):
- Direct in-app peer-to-peer monetary rewards or payment processing for returned items (prevents commercial extortion on campus).
- Native iOS/Android mobile apps (web application is designed with mobile-responsive viewports).
- Real-time GPS device beacon tracking (UniFind tracks campus locations by building and room names).

#### Assumptions and Constraints:
- Students and administrators possess an active university email account.
- The platform is deployed on Vercel's Serverless environment where local filesystem access is ephemeral, requiring external PostgreSQL persistence via Supabase.

---

### A5. User Stories
#### Table 4: End-to-End User Stories
| ID | Role | User Story Statement | Business / Technical Value |
| :--- | :--- | :--- | :--- |
| **US-01** | Student | As a student, I want to create an account with my university email so that I can submit lost and found notices. | Establishes authenticated identity and author accountability. |
| **US-02** | Student | As a student, I want to log in securely and receive a session so that I do not have to re-enter my password on every page refresh. | Delivers seamless user experience via silent HttpOnly token refresh. |
| **US-03** | Visitor | As a visitor, I want to search lost items by keyword and category so that I can immediately check if someone found my lost notebook. | Allows instant retrieval without requiring immediate account creation. |
| **US-04** | Student | As a student, I want to report a found calculator with campus location details so that the rightful owner can find and reclaim it. | Auto-binds finder ID and publishes verified report to catalog. |
| **US-05** | Student | As a student author, I want to update my report to "Returned" once my item is returned so that others know it is resolved. | Maintains clean, up-to-date campus lost-and-found records. |
| **US-06** | Student | As a student, I want to be blocked from editing or deleting other students' reports so that malicious actors cannot tamper with my lost notices. | Guarantees resource ownership security (`403 Forbidden`). |
| **US-07** | Admin | As an administrator, I want to access a private dashboard showing real-time stats so that I can monitor campus recovery rates. | Provides operational metrics on total, lost, found, and returned items. |
| **US-08** | Admin | As an administrator, I want to view a user directory and ban abusive accounts with a documented reason so that campus trolls are eliminated. | Enforces community guidelines and safety governance. |
| **US-09** | Admin | As the Main Admin, I want immunity from being banned or demoted by subordinate admins so that administrative authority is protected. | Prevents rogue admin takeover and catastrophic lockout. |
| **US-10** | Admin | As an administrator, I want banned users to be rejected immediately on their very next API call so that suspended users cannot continue posting. | Enforces instant session revocation across all active refresh tokens. |

---

# Part B. Software Requirements Specification (SRS)

### B1. Introduction & Definitions
This document specifies the technical software requirements for the UniFind platform. It serves as the baseline for implementation, automated testing, and technical evaluation.

#### Definitions and Standards:
- **JWT (JSON Web Token):** An open standard (RFC 7519) defining a compact, self-contained format for securely transmitting information between parties as a JSON object signed via HMAC-SHA256 (`HS256`).
- **Access Token:** Short-lived (15 minutes) bearer credential passed in HTTP `Authorization` headers to authorize API requests.
- **Refresh Token:** Long-lived (7 days) high-entropy cryptographic token delivered via `HttpOnly` cookie used exclusively to obtain fresh access tokens.
- **SHA-256 Session Hash:** Secure hashing applied to refresh tokens before database storage to eliminate token leakage if database dumps are compromised.
- **RBAC (Role-Based Access Control):** Restricting system access to authorized users based on verified account roles (`user` vs `admin`).
- **Proctor Immunity:** Architectural constraint ensuring the primary institutional administrator (`admin@univ.edu`) cannot be banned or stripped of privileges.

---

### B2. Functional Requirements

#### Table 5: Functional Requirements — Authentication (`FR-AUTH`)
| Requirement ID | Requirement Statement |
| :--- | :--- |
| **FR-AUTH-01** | The system shall register new user accounts with full name, email, and password, rejecting duplicate emails with `HTTP 400 Bad Request`. |
| **FR-AUTH-02** | The system shall hash user passwords using 12-round salted `bcrypt` prior to database persistence and never log or leak plaintext passwords. |
| **FR-AUTH-03** | The system shall authenticate valid credentials and issue a 15-minute cryptographically signed JWT access token containing `sub`, `email`, and `role`. |
| **FR-AUTH-04** | The system shall issue a 7-day cryptographically random refresh token delivered via a secure `HttpOnly`, `SameSite=Lax` cookie. |
| **FR-AUTH-05** | The system shall store refresh tokens in the `user_sessions` table strictly as SHA-256 hashes alongside expiration timestamps. |
| **FR-AUTH-06** | The system shall provide an `/api/auth/refresh` endpoint that verifies session validity, user suspension status, and rotates access tokens. |
| **FR-AUTH-07** | The system shall provide an `/api/auth/logout` endpoint that revokes the active session (`is_revoked = TRUE`) and clears the cookie. |
| **FR-AUTH-08** | The system shall provide an `/api/users/me` endpoint returning the authenticated user's profile and permission role. |

#### Table 6: Functional Requirements — Role-Based Access Control (`FR-RBAC`)
| Requirement ID | Requirement Statement |
| :--- | :--- |
| **FR-RBAC-01** | The system shall gate all administrative endpoints under `/api/admin/*` using a centralized dependency rejecting non-admins with `HTTP 403 Forbidden`. |
| **FR-RBAC-02** | The system shall automatically bind the authenticated student's UUID to any created lost or found report (`user_id` linkage). |
| **FR-RBAC-03** | The system shall enforce author ownership: only the original report author or an administrator can update or delete an item (`HTTP 403 Forbidden` for non-authors). |
| **FR-RBAC-04** | The system shall enforce **Main Admin Immunity**: `admin@univ.edu` ("University Proctor") cannot be banned or demoted by any user or administrator (`HTTP 400 Bad Request`). |
| **FR-RBAC-05** | The system shall enforce a **Self-Demotion Lock**: administrators cannot demote their own account to regular user status (`HTTP 400 Bad Request`). |
| **FR-RBAC-06** | The system shall enforce **Instant Session Revocation**: banning a user shall instantly set `is_revoked = TRUE` on all active refresh tokens for that user. |

#### Table 7: Functional Requirements — Administrative Governance (`FR-ADM`)
| Requirement ID | Requirement Statement |
| :--- | :--- |
| **FR-ADM-01** | The system shall provide an `/api/admin/stats` endpoint returning aggregate system counts (total items, lost, found, returned, total users, banned users). |
| **FR-ADM-02** | The system shall provide an `/api/admin/users` endpoint returning a directory of all registered accounts, their roles, and suspension states. |
| **FR-ADM-03** | The system shall allow authorized administrators to ban or unban accounts with a mandatory documented audit reason. |
| **FR-ADM-04** | The system shall allow authorized administrators to promote student accounts to administrator or demote secondary administrators. |
| **FR-ADM-05** | The system shall grant administrators global moderation authority to delete or modify any inappropriate campus item report. |

#### Table 8: Functional Requirements — Lost & Found Domain Resource (`FR-DOMAIN`)
| Requirement ID | Requirement Statement |
| :--- | :--- |
| **FR-DOMAIN-01** | The system shall allow authenticated students to report lost or found items with title, description, category, type (`lost`/`found`), location, and optional image URL. |
| **FR-DOMAIN-02** | The system shall publicly serve catalog items (`GET /api/items`) with optional keyword search across title, description, and location. |
| **FR-DOMAIN-03** | The system shall support catalog filtering by item type (`lost`, `found`), category (e.g., Electronics, Books), and status (`missing`, `returned`). |
| **FR-DOMAIN-04** | The system shall support a personal filter (`?my_items=true`) returning only reports submitted by the authenticated student. |
| **FR-DOMAIN-05** | The system shall provide an atomic status patch endpoint (`PATCH /api/items/{id}/status`) allowing authors to mark items as resolved. |

---

### B3. Non-Functional Requirements
#### Table 9: Non-Functional Requirements
| ID | Category | Requirement Specification | Verification Target |
| :--- | :--- | :--- | :--- |
| **NFR-SEC-01** | Security | Cryptographic secrets (JWT keys, DB credentials) must be loaded from environment variables and never committed to source control. | Verified via `.gitignore` and git history audits. |
| **NFR-SEC-02** | Security | Authentication errors must return generic rejection messages (e.g., *"Invalid email or password"*) to prevent user enumeration. | Automated in `test_login_invalid_credentials`. |
| **NFR-PERF-01** | Performance | Catalog retrieval under standard network conditions shall execute in under **300 ms**. | Verified on Vercel deployment via timing tabs. |
| **NFR-REL-01** | Reliability | Data must persist reliably across serverless cold starts and container recycles using cloud-managed PostgreSQL. | Verified via Supabase Transaction Pooler integration. |
| **NFR-MAINT-01**| Maintainability | Codebase must separate concerns: modular APIRouters, centralized RBAC services, and isolated CRUD database operations. | Validated by modular directory structure. |

---

### B4. Roles and Permission Matrix

#### Table 10: Endpoint Access by Role Matrix
| Endpoint / Resource Group | Visitor (Guest) | Student (User) | Second Admin | Main Admin (Proctor) |
| :--- | :---: | :---: | :---: | :---: |
| `POST /api/auth/signup`, `login` | Yes | Yes | Yes | Yes |
| `POST /api/auth/refresh`, `logout` | No | Yes | Yes | Yes |
| `GET /api/users/me` | No | Yes | Yes | Yes |
| `GET /api/items` (Public Catalog) | Yes | Yes | Yes | Yes |
| `POST /api/items` (Report Item) | No | Yes | Yes | Yes |
| `PUT /api/items/{id}` (Edit Report) | No | **Own Only** | **Any Item** | **Any Item** |
| `PATCH /api/items/{id}/status` | No | **Own Only** | **Any Item** | **Any Item** |
| `DELETE /api/items/{id}` | No | **Own Only** | **Any Item** | **Any Item** |
| `GET /api/admin/stats`, `users` | No | No | Yes | Yes |
| `PATCH /api/admin/users/{id}/ban` | No | No | Students Only | **All Users except Self** |
| `PATCH /api/admin/users/{id}/role` | No | No | No | **All Users except Self** |

#### Table 11: Item Ownership & Action Matrix
| Action | Report Owner | Other Student | Administrator |
| :--- | :---: | :---: | :---: |
| View item in public list | Allowed | Allowed | Allowed |
| Edit title, location, description | Allowed | **Blocked (403)** | Allowed (Moderation Override) |
| Toggle status to "returned" | Allowed | **Blocked (403)** | Allowed (Moderation Override) |
| Permanently delete report | Allowed | **Blocked (403)** | Allowed (Moderation Override) |

#### Table 12: Administrative Safety Constraints & Governance Rules
| Governance Rule | Rule Description & System Enforcement |
| :--- | :--- |
| **Proctor Immunity** | `admin@univ.edu` cannot be banned or demoted by any admin (`HTTP 400 Bad Request`). |
| **Self-Demotion Lock** | Administrators cannot demote their own account to `user` (`HTTP 400 Bad Request`). |
| **Peer-Ban Protection** | Second Admins cannot ban other administrators or the Main Admin (`HTTP 400 Bad Request`). |
| **Self-Ban Prevention** | No user or administrator can ban their own account (`HTTP 400 Bad Request`). |
| **Instant Revocation** | When any account is banned, all active sessions in `user_sessions` are instantly revoked. |

---

### B5. Use Cases
#### Table 13: System Use Case Specifications
| Use Case ID & Name | Actor | Preconditions | Main Success Flow | Alternate / Error Flows | Postconditions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC-01: User Login** | Student / Admin | Account registered in system. | 1. Enters email and password.<br>2. Clicks Sign In.<br>3. Server verifies bcrypt hash.<br>4. Server issues JWT access token & HttpOnly refresh cookie.<br>5. UI redirects to catalog. | 3a. Invalid credentials to Return `401 Unauthorized`.<br>3b. Banned account to Return `403 Forbidden`. | User is authenticated with active session. |
| **UC-02: Silent Token Refresh** | Browser Client | Expired access token; valid refresh cookie. | 1. Client detects 401 on protected route.<br>2. Interceptor calls `/api/auth/refresh`.<br>3. Server validates SHA-256 session hash in DB.<br>4. Issues fresh 15-minute access token.<br>5. Client replays original request. | 3a. Revoked or expired session to Return `401 Unauthorized`; client redirects to login. | User session seamlessly continued. |
| **UC-03: Report Item** | Student | Authenticated session. | 1. Opens "Report Item" modal.<br>2. Enters title, category, location.<br>3. Submits form.<br>4. Server injects `user_id` from JWT.<br>5. Record saved in DB; returns `201 Created`. | 2a. Missing fields to Return `422 Unprocessable Entity`. | Item published in campus catalog. |
| **UC-04: Unauthorized Edit (RBAC)** | Malicious Student | Authenticated session. | 1. Sends `PUT /api/items/{id}` for item owned by another student.<br>2. Server executes `check_item_ownership()`.<br>3. Detects `item.user_id != current_user.id`.<br>4. Rejects with `403 Forbidden`. | — | Item remains unmodified; unauthorized attempt blocked. |
| **UC-05: Ban User & Instant Revoke** | Admin | Admin credentials. | 1. Admin navigates to `/admin`.<br>2. Clicks "Ban User" on target.<br>3. Enters audit reason.<br>4. Server validates safety guards.<br>5. Marks user `is_banned = TRUE` and all user sessions `is_revoked = TRUE`. | 4a. Target is Main Admin to Return `400 Bad Request`.<br>4b. Target is self to Return `400 Bad Request`. | Banned user instantly blocked on subsequent requests. |
| **UC-06: Resolve Item Status** | Report Author | Item reported as "missing". | 1. Author views their item detail.<br>2. Clicks "Mark as Returned".<br>3. Sends `PATCH /api/items/{id}/status`.<br>4. Ownership verified; status updated in DB. | 3a. Non-owner sends request to Return `403 Forbidden`. | Item updated to "returned" status in catalog. |

---

### B6. Acceptance Criteria
#### Table 14: Given-When-Then Acceptance Criteria
| Scenario ID | Test Scenario | Acceptance Test Specification (Given - When - Then) |
| :--- | :--- | :--- |
| **AC-01** | Token Expiration Rejection | **Given** an expired JWT access token, **When** requested against `/api/users/me`, **Then** the system rejects the call with `401 Unauthorized`. |
| **AC-02** | Signature Tampering | **Given** a JWT token with modified payload claims, **When** sent to any protected endpoint, **Then** the system detects invalid signature and returns `401 Unauthorized`. |
| **AC-03** | Non-Author Item Tampering | **Given** Student B logged in, **When** attempting `DELETE /api/items/{id}` on Student A's item, **Then** the system blocks the request with `403 Forbidden`. |
| **AC-04** | Student Access to Admin Portal | **Given** a normal student account, **When** requesting `/api/admin/stats` or `/api/admin/users`, **Then** the system denies access with `403 Forbidden`. |
| **AC-05** | Proctor Ban Immunity | **Given** a secondary administrator logged in, **When** attempting to ban `admin@univ.edu`, **Then** the system rejects the ban with `400 Bad Request`. |
| **AC-06** | Self-Demotion Lockout | **Given** an administrator logged in, **When** attempting to demote their own role to `user`, **Then** the system rejects the operation with `400 Bad Request`. |
| **AC-07** | Instant Revocation on Ban | **Given** an active student session, **When** an admin bans that student, **Then** the student's next request returns `403 Forbidden` and refresh tokens fail. |

---

### B7. Traceability Matrix
#### Table 15: Requirements Traceability Matrix
| Requirement ID | Module / File Implementing | Automated Test Case | Evidence ID |
| :--- | :--- | :--- | :---: |
| **FR-AUTH-01** | `backend/routers/auth.py` | `test_user_signup_and_duplicate_rejection` | S1 |
| **FR-AUTH-03** | `backend/auth.py`, `routers/auth.py` | `test_demo_accounts_seeded` | S1, S7 |
| **FR-AUTH-06** | `backend/routers/auth.py` | `test_refresh_token_and_logout_revocation` | S8 |
| **FR-AUTH-07** | `backend/routers/auth.py` | `test_refresh_token_and_logout_revocation` | S4 |
| **FR-RBAC-01** | `backend/services/rbac.py` | `test_student_blocked_from_admin_endpoints` | S6 |
| **FR-RBAC-02** | `backend/routers/items.py` | `test_create_item_links_author` | S2 |
| **FR-RBAC-03** | `backend/routers/items.py` | `test_non_author_forbidden_from_editing_or_deleting` | S6 |
| **FR-RBAC-04** | `backend/services/rbac.py` | `test_main_admin_hierarchy_and_proctor_immunity` | S13 |
| **FR-RBAC-05** | `backend/services/rbac.py` | `test_safety_guard_2_self_demotion_lock` | S11 |
| **FR-RBAC-06** | `backend/services/rbac.py` | `test_safety_guard_3_instant_session_revocation` | S9, S13 |
| **FR-ADM-01** | `backend/routers/admin.py` | `test_admin_can_access_portal_and_stats` | S10 |
| **FR-ADM-02** | `backend/routers/admin.py` | `test_admin_can_access_portal_and_stats` | S11 |
| **FR-DOMAIN-01**| `backend/routers/items.py` | `test_create_item_links_author` | S2 |
| **FR-DOMAIN-02**| `backend/routers/items.py` | `test_public_item_listing_and_stats` | S2 |
| **FR-DOMAIN-05**| `backend/routers/items.py` | `test_author_can_update_own_item_and_status` | S2 |

---

# Part C. Technical Design Document (TDD)

### C1. Technology Stack
#### Table 16: Production Technology Stack
| Layer / Component | Technology Selected | Version | Engineering Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript | 19.x / 5.x | Strongly typed functional component hierarchy with strict compile-time checks. |
| **Build Tool & Bundler** | Vite | 8.x | High-speed Hot Module Replacement (HMR) and optimized rollup production bundles. |
| **Backend Framework** | FastAPI (Python) | 0.115+ | High-performance asynchronous REST framework with automatic OpenAPI documentation. |
| **Data Validation** | Pydantic v2 | 2.10+ | Fast Rust-backed schema validation and serialisation with strict typing. |
| **Primary Cloud Database**| Supabase PostgreSQL | 15.x | Managed PostgreSQL in Tokyo (`ap-northeast-1`) with transaction connection pooling. |
| **Local / Test Database** | SQLite 3 | Built-in | Autonomous, zero-config embedded database engine for offline development and testing. |
| **Database Adapter** | `psycopg2-binary` | 2.9.9+ | Industrial-strength PostgreSQL client adapter supporting SSL mode and cursor dictionaries. |
| **Password Hashing** | `bcrypt` | 4.0+ | Adaptive 12-round key derivation function resistant to hardware brute-force attacks. |
| **Token Cryptography** | `PyJWT` | 2.9+ | Standard-compliant RFC 7519 HMAC-SHA256 signature generation and claims validation. |
| **Automated Testing** | `pytest` + `httpx` | 9.x / 0.28+ | Expressive test harness running isolated regression test clients against FastAPI. |
| **Hosting Platform** | Vercel Full-Stack | Serverless | Integrated edge deployment routing static assets and Python serverless functions via `vercel.json`. |

---

### C2. System Architecture

```
                                  UniFind System Architecture
                                  
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       Client Browser (React 19 + Vite)                 │
   │  [ AuthContext ]  ──  [ api.ts Interceptor ]  ──  [ App / Admin Views ]│
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
                        HTTPS / REST (Bearer JWT / Cookie)
                                       │
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                 Vercel Serverless Edge Gateway (vercel.json)           │
   │           /api/* ──> Python Serverless Function (backend/main:app)     │
   └───────────────────────────────────┬────────────────────────────────────┘
                                       │
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                        FastAPI Application Core                        │
   │  ┌───────────────────────┬────────────────────────┬──────────────────┐ │
   │  │ backend/routers/auth  │ backend/routers/items  │ routers/admin    │ │
   │  └───────────┬───────────┴───────────┬────────────┴─────────┬────────┘ │
   │              ▼                       ▼                      ▼          │
   │  ┌───────────────────────────────────────────────────────────────────┐ │
   │  │                 RBAC & Safety Guards (backend/services/rbac.py)   │ │
   │  └───────────────────────────────────┬───────────────────────────────┘ │
   │                                      ▼                                 │
   │  ┌───────────────────────────────────────────────────────────────────┐ │
   │  │             Data Layer (backend/crud.py & database.py)            │ │
   │  │             PostgresCursorWrapper (Auto query translation)         │ │
   │  └───────────────────────────────────┬───────────────────────────────┘ │
   └──────────────────────────────────────┼─────────────────────────────────┘
                                          │
                      Transaction Pooler (Port 6543, SSL Required)
                                          │
                                          ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │             Supabase Cloud Managed PostgreSQL (ap-northeast-1)         │
   │          Tables: [ users ] ──── [ items ] ──── [ user_sessions ]       │
   └────────────────────────────────────────────────────────────────────────┘
```

#### Architecture Request Flow:
1. **Client Request:** The user interacts with React; `frontend/src/api.ts` attaches `Authorization: Bearer <access_token>` and sends requests with `credentials: "same-origin"` to include cookies.
2. **Vercel Edge Routing:** `vercel.json` intercepts `/api/*` and transparently routes the request to the FastAPI serverless container (`backend/main.py:app`).
3. **Authentication & Dependency Injection:** FastAPI extracts the Bearer token in `backend/routers/auth.py` (`get_current_user`), decodes the claims, and verifies the user exists and is not banned.
4. **RBAC & Safety Enforcement:** `backend/services/rbac.py` validates role authorizations and checks that non-authors cannot modify other students' records.
5. **Database Execution:** `backend/database.py` utilizes `PostgresConnectionWrapper` and `PostgresCursorWrapper` to translate queries to PostgreSQL `%s` placeholders, connecting to Supabase Cloud on port 6543.
6. **Response Serialization:** Data returned from PostgreSQL is serialized via Pydantic models in `backend/models.py` and transmitted back to the browser as JSON.

---

### C3. Backend and Frontend Structure

#### Backend Folder Tree (`backend/`):
```text
backend/
├── auth.py                  # Cryptographic utilities: bcrypt hashing, JWT & SHA-256 tokens
├── crud.py                  # Isolated SQL query repository (users, items, user_sessions)
├── database.py              # Dual-mode DB connection engine (Supabase PostgreSQL + SQLite)
├── main.py                  # FastAPI entrypoint, CORS configuration, router mounting
├── models.py                # Pydantic v2 data models, validation schemas & ConfigDict
├── requirements.txt         # Production backend dependencies
├── supabase_schema.sql      # Production PostgreSQL schema, indexes & seed accounts
├── routers/                 # Modular APIRouter packages
│   ├── admin.py             # Administrative governance endpoints (/api/admin/*)
│   ├── auth.py              # Authentication, session, login & token refresh endpoints
│   ├── items.py             # Lost and found item CRUD endpoints (/api/items/*)
│   └── system.py            # Health check, statistics, and system info endpoints
├── services/
│   └── rbac.py              # Reusable RBAC dependencies, safety guards & session revoke
└── tests/                   # Automated Pytest regression test suite
    ├── conftest.py          # Isolated test database lifecycle & test client fixtures
    ├── test_auth.py         # 6 tests: Login, signup, password verification, refresh
    ├── test_items.py        # 5 tests: Item CRUD, author auto-binding, 403 guards
    └── test_rbac.py         # 5 tests: Admin gating, Proctor immunity, session revoke
```

#### Frontend Folder Tree (`frontend/`):
```text
frontend/
├── index.html               # Single Page Application entrypoint
├── package.json             # Frontend dependencies and build scripts
├── vite.config.ts           # Vite bundler configuration & local backend API proxy
├── src/
│   ├── App.tsx              # Main application coordinator, state management & view router
│   ├── AuthContext.tsx      # Global React authentication state provider & silent refresh
│   ├── api.ts               # HTTP client service, Bearer interceptor & retry handler
│   ├── index.css            # University design system styles & component tokens
│   ├── main.tsx             # React root mounting
│   ├── types.ts             # TypeScript interfaces for users, items, stats & filters
│   └── components/
│       ├── AdminDashboard.tsx   # Proctor admin portal (metrics, user table, ban modal)
│       ├── AuthPage.tsx         # Unified login & student registration portal
│       ├── FiltersBar.tsx       # Search keyword, category, status & type filter controls
│       ├── ItemCard.tsx         # Individual lost/found item presentation card
│       ├── ItemDetailModal.tsx  # Detailed modal with contact reveal & status resolution
│       ├── ItemFormModal.tsx    # Modal form to submit new lost/found reports
│       ├── Navbar.tsx           # Campus navigation header with profile pill & role badge
│       ├── StatsCards.tsx       # Real-time metrics counters (Total, Lost, Found, Returned)
│       └── Toast.tsx            # Non-blocking user feedback notification toasts
```

---

### C4. Data Model & Database Schema

#### Figure 3: Entity-Relationship Diagram
```
  ┌───────────────────────────────────┐
  │               users               │
  ├───────────────────────────────────┤
  │ id: TEXT (PK)                     │◄──────┐
  │ email: TEXT (UNIQUE)              │       │
  │ full_name: TEXT                   │       │ 1:N
  │ password_hash: TEXT               │       │
  │ role: TEXT ('user' | 'admin')     │       │
  │ is_banned: BOOLEAN                │       │
  │ ban_reason: TEXT                  │       │
  │ created_at: TIMESTAMPTZ           │       │
  └─────────────────┬─────────────────┘       │
                    │                         │
                    │ 1:N                     │
                    ▼                         │
  ┌───────────────────────────────────┐       │
  │               items               │       │
  ├───────────────────────────────────┤       │
  │ id: TEXT (PK)                     │       │
  │ title: TEXT                       │       │
  │ description: TEXT                 │       │
  │ category: TEXT                    │       │
  │ type: TEXT ('lost' | 'found')     │       │
  │ location: TEXT                    │       │
  │ date: DATE                        │       │
  │ contact_email: TEXT               │       │
  │ image_url: TEXT                   │       │
  │ status: TEXT ('missing'|'returned')       │
  │ user_id: TEXT (FK -> users.id)   ─┼───────┘
  │ created_at: TIMESTAMPTZ           │
  │ updated_at: TIMESTAMPTZ           │
  └───────────────────────────────────┘
                    │
                    │
  ┌───────────────────────────────────┐
  │           user_sessions           │
  ├───────────────────────────────────┤
  │ id: TEXT (PK)                     │
  │ user_id: TEXT (FK -> users.id)    │
  │ token_hash: TEXT (UNIQUE)         │
  │ expires_at: TIMESTAMPTZ           │
  │ is_revoked: BOOLEAN               │
  │ created_at: TIMESTAMPTZ           │
  └───────────────────────────────────┘
```

#### Table 17: Database Schema Definitions
| Table Name | Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`users`** | `id` | `TEXT` | `PRIMARY KEY` | UUIDv4 identifier. |
| | `email` | `TEXT` | `UNIQUE, NOT NULL` | University email address. |
| | `full_name` | `TEXT` | `NOT NULL` | Registered student/admin full name. |
| | `password_hash` | `TEXT` | `NOT NULL` | 12-round salted `bcrypt` hash string. |
| | `role` | `TEXT` | `DEFAULT 'user'` | Account authorization level (`user` or `admin`). |
| | `is_banned` | `BOOLEAN` | `DEFAULT FALSE` | Suspension flag for administrative lockouts. |
| | `ban_reason` | `TEXT` | `NULLABLE` | Documented reason for account ban. |
| | `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Timestamp of account registration. |
| **`items`** | `id` | `TEXT` | `PRIMARY KEY` | UUIDv4 identifier for the item. |
| | `title` | `TEXT` | `NOT NULL` | Descriptive title of lost or found item. |
| | `description` | `TEXT` | `NOT NULL` | Full details, markings, and condition. |
| | `category` | `TEXT` | `NOT NULL` | Item category (Electronics, Cards, Books). |
| | `type` | `TEXT` | `NOT NULL` | Notice classification (`lost` or `found`). |
| | `location` | `TEXT` | `NOT NULL` | Campus building or room where misplaced/found. |
| | `date` | `DATE` | `NOT NULL` | Date when item was lost or found. |
| | `contact_email`| `TEXT` | `NOT NULL` | Contact email of the student reporter. |
| | `image_url` | `TEXT` | `DEFAULT ''` | Optional link or photo URL. |
| | `status` | `TEXT` | `DEFAULT 'missing'`| Resolution status (`missing`, `found`, `returned`).|
| | `user_id` | `TEXT` | `FK -> users.id` | Foreign key referencing original reporter. |
| | `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Submission creation timestamp. |
| | `updated_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Last modification timestamp. |
| **`user_sessions`**| `id`| `TEXT` | `PRIMARY KEY` | UUIDv4 session record identifier. |
| | `user_id` | `TEXT` | `FK -> users.id` | Student/admin associated with session. |
| | `token_hash` | `TEXT` | `UNIQUE, NOT NULL` | SHA-256 hash of the 7-day refresh token. |
| | `expires_at` | `TIMESTAMPTZ`| `NOT NULL` | Expiration timestamp (7 days from issue). |
| | `is_revoked` | `BOOLEAN` | `DEFAULT FALSE` | Immediate revocation flag for logout and bans. |
| | `created_at` | `TIMESTAMPTZ`| `DEFAULT NOW()` | Session establishment timestamp. |

---

### C5. REST API Design
All endpoints return standard JSON payloads. Errors conform to RFC 7807 structured objects containing `{"detail": "Error description"}`.

#### Table 18: Comprehensive API Endpoint Registry
| Method | Path | Auth Required? | Required Role | Request Body | Success | Error Statuses |
| :--- | :--- | :---: | :---: | :--- | :---: | :---: |
| `POST` | `/api/auth/signup` | No | Any | `UserCreate` | `201` | `400`, `422` |
| `POST` | `/api/auth/login` | No | Any | `UserLogin` | `200` | `401`, `403`, `422` |
| `POST` | `/api/auth/refresh`| Cookie | Any | None / Optional | `200` | `401`, `403` |
| `POST` | `/api/auth/logout` | Yes | Authenticated | None | `200` | `401` |
| `GET` | `/api/users/me` | Yes | Authenticated | None | `200` | `401`, `403` |
| `GET` | `/api/items` | No | Public | Query params | `200` | `400` |
| `GET` | `/api/items/{id}` | No | Public | None | `200` | `404` |
| `POST` | `/api/items` | Yes | Student/Admin | `ItemCreate` | `201` | `401`, `422` |
| `PUT` | `/api/items/{id}` | Yes | Owner/Admin | `ItemUpdate` | `200` | `401`, `403`, `404` |
| `PATCH`| `/api/items/{id}/status`| Yes | Owner/Admin | `ItemStatusUpdate` | `200` | `401`, `403`, `404` |
| `DELETE`|`/api/items/{id}` | Yes | Owner/Admin | None | `200` | `401`, `403`, `404` |
| `GET` | `/api/admin/stats` | Yes | Admin Only | None | `200` | `401`, `403` |
| `GET` | `/api/admin/users` | Yes | Admin Only | None | `200` | `401`, `403` |
| `PATCH`| `/api/admin/users/{id}/ban`| Yes | Admin Only | `BanUserRequest` | `200` | `400`, `401`, `403` |
| `PATCH`| `/api/admin/users/{id}/role`| Yes | Main Admin | `ChangeRoleRequest` | `200` | `400`, `401`, `403` |
| `GET` | `/api/health` | No | Public | None | `200` | — |

---

### C6. JWT Authentication & Session Lifecycle Design

#### Table 19: JWT Token Claims and Structure
| Token Claim | Claim Value | Description |
| :--- | :--- | :--- |
| `sub` | `user_id` (UUIDv4) | Subject identifier mapping directly to `users.id`. |
| `email` | `user@univ.edu` | Registered university email address. |
| `role` | `'user'` or `'admin'` | Authorization role used for client and server decisions. |
| `iat` | Unix Timestamp | Timestamp when the token was signed. |
| `exp` | Unix Timestamp | Expiration timestamp (strictly **15 minutes** from issue). |

#### Token Lifetimes & Storage Rationale:
- **15-Minute Access Token:** Kept in memory and `sessionStorage`. Its short lifespan limits the window of opportunity if intercepted.
- **7-Day Refresh Token:** Stored in an `HttpOnly`, `SameSite=Lax`, `Path=/api/auth` cookie. JavaScript cannot read `HttpOnly` cookies, eliminating Cross-Site Scripting (XSS) token theft.
- **SHA-256 Session Storage:** The server never stores plaintext refresh tokens. A hash is stored in `user_sessions`. When `/api/auth/refresh` is called, the cookie is hashed and checked against the database.
- **Frontend Interceptor Flow:** If an API call receives a `401 Unauthorized`, `frontend/src/api.ts` transparently pauses requests, calls `/api/auth/refresh`, updates the in-memory access token, and replays the original request without user interruption.

---

### C7. RBAC & Security Guard Architecture

#### Authorisation Pipeline:
```
Incoming Request ──> Extract Bearer Token ──> Validate Signature & Expiry ──> Lookup User
                                                                                    │
               ┌────────────────────────────────────────────────────────────────────┘
               ▼
     User Exists & Not Banned? ──NO──> HTTP 403 Forbidden
               │
              YES
               ▼
     Admin Endpoint (/api/admin/*)? ──YES──> Is Role == 'admin'? ──NO──> HTTP 403 Forbidden
               │                                      │
              NO                                     YES
               ▼                                      ▼
     Item Modification (PUT/PATCH/DELETE)?        Execute Controller Action
               │
              YES
               ▼
     check_item_ownership()
       ├── user_id == item.user_id? ──YES──> ALLOW
       ├── role == 'admin'? ─────────YES──> ALLOW
       └── Otherwise ─────────────────NO───> HTTP 403 Forbidden
```

#### Reusable Permission Code Excerpt (`backend/services/rbac.py`):
```python
def require_role(allowed_roles: List[str]) -> Callable:
    """Centralized RBAC Dependency gating endpoints by account role."""
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "user")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Administrator privileges required.",
            )
        return current_user
    return role_checker

def require_admin() -> Callable:
    """Convenience dependency for administrative routes."""
    return require_role(["admin"])
```

---

### C8. Admin Dashboard Design
The administrative interface (`frontend/src/components/AdminDashboard.tsx`) is exclusively accessible to users with `role === 'admin'`:
1. **Real-Time Analytics Grid:** Invokes `GET /api/admin/stats` to render 4 metric cards: Total Reported Items, Lost Belongs, Recovered Items, and Total Registered Students.
2. **User Governance Directory:** Invokes `GET /api/admin/users` to display all accounts. Provides immediate role promotion/demotion toggles and suspension triggers.
3. **Audit-Backed Ban Modal:** When banning an account, prompts the administrator for an audit violation reason. Upon submission, calls `PATCH /api/admin/users/{id}/ban`.
4. **Safety Enforcement:** The UI disables the Ban and Demote action buttons for the University Proctor (`admin@univ.edu`), matching backend validation.

---

### C9. Security Design, Threat Modeling & Mitigations
#### Table 20: Security Threat Model & Applied Countermeasures
| Threat Category | Specific Threat Description | Technical Countermeasure | Code File Implementing |
| :--- | :--- | :--- | :--- |
| **Credential Compromise** | Database dump exposes student passwords. | 12-round salted `bcrypt` irreversible key derivation. | `backend/auth.py` |
| **Token Interception** | Long-lived token stolen via XSS. | Short 15-min JWT access token; refresh token in `HttpOnly` cookie. | `backend/routers/auth.py` |
| **Database Token Leak** | Refresh token stolen from stolen DB backups. | Stored exclusively as SHA-256 one-way hashes in `user_sessions`. | `backend/auth.py`, `crud.py` |
| **Horizontal Privilege Escalation** | Student attempts to delete another student's report. | `check_item_ownership()` enforces UUID match on every mutation. | `backend/routers/items.py` |
| **Vertical Privilege Escalation** | Student attempts to call admin endpoints directly. | `require_admin()` server-side dependency on all `/api/admin/*` routes. | `backend/services/rbac.py` |
| **Administrative Takeover** | Secondary admin attempts to ban or demote Proctor. | `validate_ban_action()` hard-locks Main Admin immunity. | `backend/services/rbac.py` |
| **SQL Injection** | Malicious inputs in search filters or login. | 100% parameterized queries via `psycopg2` / `sqlite3` (`?` & `%s`). | `backend/crud.py`, `database.py` |
| **Cross-Site Request Forgery** | Attacker triggers unauthorized state changes. | SameSite=Lax cookie attribute; sensitive operations require Bearer token. | `backend/routers/auth.py` |

---

### C10. Deployment Configuration on Vercel
UniFind is deployed as a unified full-stack application on Vercel using `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "backend": {
      "root": "backend",
      "framework": "fastapi",
      "entrypoint": "main:app"
    },
    "frontend": {
      "root": "frontend",
      "framework": "vite"
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/docs", "destination": { "service": "backend" } },
    { "source": "/openapi.json", "destination": { "service": "backend" } },
    { "source": "/redoc", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

#### Table 21: Production Environment Variables Configuration
| Variable Name | Required Scope | Purpose / Description (Values Kept Secret) |
| :--- | :--- | :--- |
| `DATABASE_URL` | Vercel Backend Service | PostgreSQL connection URI to Supabase Tokyo Pooler (`port 6543`, `sslmode=require`). |
| `JWT_SECRET_KEY` | Vercel Backend Service | 256-bit high-entropy secret key used to sign and verify HMAC-SHA256 JWT tokens. |

---

### C11. Automated Testing Strategy & Pytest Results
UniFind includes 16 automated tests executed via `pytest`. The test runner creates an isolated temporary SQLite database file for each test session (`conftest.py`), ensuring tests execute offline without altering live cloud data.

#### Table 22: Pytest Test Suite Execution Results (16/16 Pass)
| Test Module | Test Name | Target Requirement | Execution Result |
| :--- | :--- | :--- | :---: |
| `test_auth.py` | `test_demo_accounts_seeded` | Seed accounts exist and authenticate | **PASSED** |
| `test_auth.py` | `test_user_signup_and_duplicate_rejection` | User signup & duplicate email block | **PASSED** |
| `test_auth.py` | `test_login_invalid_credentials` | Rejection of invalid credentials (401) | **PASSED** |
| `test_auth.py` | `test_get_me_profile_authenticated` | Authenticated profile retrieval | **PASSED** |
| `test_auth.py` | `test_protected_routes_reject_missing_token` | Missing token rejected with 401 | **PASSED** |
| `test_auth.py` | `test_refresh_token_and_logout_revocation` | Token refresh and logout revocation | **PASSED** |
| `test_items.py` | `test_public_item_listing_and_stats` | Public catalog & metrics retrieval | **PASSED** |
| `test_items.py` | `test_create_item_links_author` | Item creation auto-links author ID | **PASSED** |
| `test_items.py` | `test_author_can_update_own_item_and_status` | Authors can edit their reports | **PASSED** |
| `test_items.py` | `test_non_author_forbidden_from_editing_or_deleting`| Non-authors blocked with 403 | **PASSED** |
| `test_items.py` | `test_admin_can_override_and_delete_any_item` | Admin moderation override | **PASSED** |
| `test_rbac.py` | `test_student_blocked_from_admin_endpoints` | Students blocked from /admin routes | **PASSED** |
| `test_rbac.py` | `test_admin_can_access_portal_and_stats` | Admins authorized for /admin routes | **PASSED** |
| `test_rbac.py` | `test_main_admin_hierarchy_and_proctor_immunity` | Proctor immunity & peer-ban locks | **PASSED** |
| `test_rbac.py` | `test_safety_guard_2_self_demotion_lock` | Admin self-demotion lockout prevention | **PASSED** |
| `test_rbac.py` | `test_safety_guard_3_instant_session_revocation`| Immediate session revocation on ban | **PASSED** |

---

# Part D. Evidence: Screenshots of the Running Application

> *Note: In your final submitted PDF, replace the text boxes below with your cropped browser screenshots taken on `https://2230470.vercel.app`.*

### D1. User Side
- **[S1: Signup and Login Page]**  
  *Caption:* UniFind authentication page showing validation feedback when submitting invalid credentials. Demonstrates requirement `FR-AUTH-01`.
- **[S2: Main Feature Catalog Page (Logged-in Student)]**  
  *Caption:* The campus catalog displaying verified lost and found item cards with category badges and location indicators. Demonstrates `FR-DOMAIN-02`.
- **[S3: Profile Pill & Navbar Role Indicator]**  
  *Caption:* Authenticated navigation bar indicating student name "Bashar Jondir" with student role badge. Demonstrates `FR-AUTH-08`.
- **[S4: Session Logout Action]**  
  *Caption:* User initiating session logout, clearing access tokens and revoking database refresh sessions. Demonstrates `FR-AUTH-07`.
- **[S5: Item Report Modal Form]**  
  *Caption:* Form to report a misplaced item with title, category, location, and description fields. Demonstrates `FR-DOMAIN-01`.
- **[S6: Action Denied by RBAC (HTTP 403 Forbidden)]**  
  *Caption:* Browser alert and Network tab displaying `403 Forbidden` when attempting to edit an item belonging to another student. Demonstrates `FR-RBAC-03`.

### D2. Security Behaviour
- **[S7: Expired Token Rejection (HTTP 401)]**  
  *Caption:* Chrome DevTools Network tab showing an expired access token returning `401 Unauthorized`. Demonstrates `AC-01`.
- **[S8: Silent Refresh Request & HttpOnly Cookie]**  
  *Caption:* DevTools Application tab showing `refresh_token` stored as an `HttpOnly` cookie and the successful `/api/auth/refresh` network call. Demonstrates `FR-AUTH-04`.
- **[S9: Banned User Request Rejection]**  
  *Caption:* Network tab showing a suspended student account receiving `403 Forbidden` on subsequent API calls. Demonstrates `FR-RBAC-06`.

### D3. Admin Dashboard
- **[S10: Overview Statistics Cards]**  
  *Caption:* The Admin Dashboard displaying real-time metrics for total items, lost, found, returned, and total users. Demonstrates `FR-ADM-01`.
- **[S11: User Governance Directory]**  
  *Caption:* The User Management table displaying registered students and admins with role promotion and demotion toggles. Demonstrates `FR-ADM-02`.
- **[S12: University Proctor Immunity Lock]**  
  *Caption:* User management table showing the Main Admin account with Ban and Demote action buttons disabled. Demonstrates `FR-RBAC-04`.
- **[S13: Audit Ban Dialog with Policy Reason]**  
  *Caption:* Modal dialog prompting the admin for a policy violation reason before suspending an account. Demonstrates `FR-ADM-03`.
- **[S14: Item Moderation Table]**  
  *Caption:* Administrative moderation view showing all campus reports with override deletion controls. Demonstrates `FR-ADM-05`.
- **[S15: Public Catalog Search & Filters]**  
  *Caption:* Searching items by keyword "Calculator" and category "Electronics". Demonstrates `FR-DOMAIN-03`.
- **[S16: Resolved Item Status Indicator]**  
  *Caption:* Item card displaying green "Returned" status badge after author resolution. Demonstrates `FR-DOMAIN-05`.
- **[S17: Interactive Swagger UI Documentation]**  
  *Caption:* The `/docs` endpoint rendering interactive OpenAPI documentation for all routers. Demonstrates Part 5 modularity.

### D4. Deployment
- **[S18: Vercel Production Deployment Overview]**  
  *Caption:* Vercel project dashboard showing active production deployment on `https://2230470.vercel.app`.
- **[S19: Vercel Environment Variables Configuration]**  
  *Caption:* Vercel settings panel displaying `DATABASE_URL` and `JWT_SECRET_KEY` configured with values hidden.
- **[S20: Supabase Cloud Database Dashboard]**  
  *Caption:* Supabase dashboard showing `users`, `items`, and `user_sessions` tables hosted in Tokyo (`ap-northeast-1`).

### D5. Tests Output
- **[S21: Pytest Test Run Output (16/16 Passed)]**  
  *Caption:* Terminal output showing `16 passed in 7.08s` across `test_auth.py`, `test_items.py`, and `test_rbac.py`.

---

# Part E. Project Management and Conclusion

### E1. How to Run and Test Locally

#### Prerequisites:
- Python 3.10+ installed
- Node.js 18+ and `npm` installed
- Git installed

#### Step 1: Clone the Repository
```bash
git clone https://github.com/BasharJondir/UniFind-A-Web-Based-University-Lost-and-Found-Management-System.git
cd UniFind-A-Web-Based-University-Lost-and-Found-Management-System
```

#### Step 2: Start the Backend (Terminal 1)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- API will be accessible at: `http://localhost:8000`
- Swagger Documentation: `http://localhost:8000/docs`

#### Step 3: Start the Frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
- Web Application will be live at: `http://localhost:5173`

#### Step 4: Run the Automated Test Suite
From the root directory:
```powershell
.\backend\.venv\Scripts\python.exe -m pytest backend/tests -v
```

---

### E2. GitHub Work Breakdown
#### Table 23: GitHub Pull Requests and Milestones
| PR # | Title & Branch | Scope Delivered | Status |
| :---: | :--- | :--- | :---: |
| **#14** | `feat: Complete UniFind Production Upgrade` (`feature/final-project-upgrade` to `main`) | Merged final project upgrade specifications, updated README, verified all 7 parts. | **Merged** |
| **#12** | `Feature: User Authentication System & JWT Session Revocation` (`feature/auth-jwt-system-part-1-2`) | Added bcrypt hashing, JWT access tokens, HttpOnly refresh cookies, `AuthPage.tsx`. | **Merged** |
| **#10** | `Refactor backend architecture with dedicated CRUD service` (`feature/backend-router-crud`) | Decoupled monolithic routes into `backend/routers/` (`auth`, `items`, `admin`, `system`). | **Merged** |
| **#8** | `Create, Update & Delete Workflows` (`main` to `projectfeature/1-projectdoc`) | Form modals, item update endpoints, and status toggles. | **Merged** |
| **#2** | `Add Project Documentation (PRD, SRS, and TDD)` (`projectfeature/1-projectdoc`) | Initial project architectural documentation and requirements specifications. | **Merged** |

---

### E3. Known Limitations
1. **Cloud Photo Storage:** Image attachments currently accept external image URLs rather than direct multi-part binary file uploads to an AWS S3 or Supabase Storage bucket.
2. **Email Verification:** The registration endpoint validates email syntax via Pydantic `EmailStr` but does not send an automated SMTP email confirmation link.
3. **Automated Claim Challenge:** Claiming an item is facilitated by revealing finder contact details; automated ownership verification quizzes are not yet implemented.

---

### E4. Future Work
1. **Direct Photo Uploads (Priority 1):** Integrate Supabase Storage buckets for direct mobile photo capture and upload.
2. **Real-time Push Notifications (Priority 2):** Implement WebSockets or automated emails notifying students when an item matching their lost report keywords is submitted.
3. **Interactive Campus Map (Priority 3):** Embed Leaflet / OpenStreetMap visual pins displaying the exact campus building and floor where items were misplaced.

---

### E5. Sources, Libraries, and Tools
#### Table 24: External Libraries, Frameworks, and Tools Utilized
| Tool / Library | Version | Documentation Link | Purpose in UniFind |
| :--- | :--- | :--- | :--- |
| **FastAPI** | 0.115.5 | `fastapi.tiangolo.com` | High-performance Python backend framework and REST API routing. |
| **Pydantic** | 2.10.2 | `docs.pydantic.dev` | Strict request/response data model validation and serialization. |
| **PyJWT** | 2.9.0 | `pyjwt.readthedocs.io` | RFC 7519 HMAC-SHA256 JWT encoding, claims verification, and decoding. |
| **bcrypt** | 4.0.1 | `pypi.org/project/bcrypt` | 12-round salted password hashing. |
| **psycopg2-binary** | 2.9.9 | `psycopg.org` | PostgreSQL client adapter for cloud database communication. |
| **pytest** | 9.2.0 | `docs.pytest.org` | Automated testing runner for backend regression suite. |
| **React** | 19.0.0 | `react.dev` | Component-driven declarative UI library. |
| **Vite** | 8.3.2 | `vite.dev` | Frontend build tool and development server. |
| **Supabase** | Cloud | `supabase.com` | Cloud-hosted PostgreSQL relational database with connection pooling. |
| **Vercel** | Cloud | `vercel.com` | Edge hosting, static asset delivery, and Python serverless function execution. |

---

# Appendix: Demo Test Accounts and Video Demonstration

### Video Demonstration Link:
- **Demonstration Video URL:** `https://youtu.be/unifind-demo-cse309` *(Replace with your unlisted YouTube or Google Drive link)*
- **Duration:** 6 minutes 30 seconds
- **Walkthrough Content:** Registration, student login, catalog search/filter, item reporting, author-only editing, 403 Forbidden ownership demonstration, Proctor login, Admin Dashboard metrics, and user moderation.

---

### Pre-Seeded Evaluation Accounts:

> *These credentials are pre-seeded in the live Supabase PostgreSQL database and local SQLite test databases.*

#### 1. Main Administrator (University Proctor)
- **Role:** `admin` (Supreme hierarchy with Proctor Immunity)
- **Email:** `admin@univ.edu`
- **Password:** `Pass123!`
- **Full Name:** University Proctor
- **Capabilities:** Full system access, view analytics, ban secondary admins or students, moderate all items. Cannot be banned or demoted.

#### 2. Secondary Administrator
- **Role:** `admin`
- **Email:** `admin2@univ.edu`
- **Password:** `password123`
- **Full Name:** Second Admin
- **Capabilities:** View analytics, moderate items, ban students. Cannot ban the University Proctor or demote own account.

#### 3. Primary Student Account
- **Role:** `user`
- **Email:** `student@univ.edu`
- **Password:** `Pass123!`
- **Full Name:** Bashar Jondir
- **Capabilities:** Report items, edit own reports, mark own reports as returned, view public catalog. Blocked from `/api/admin/*`.

#### 4. Secondary Student Account (Ownership Testing)
- **Role:** `user`
- **Email:** `otherstudent@univ.edu`
- **Password:** `Pass123!`
- **Full Name:** Other Student
- **Capabilities:** Used during evaluation to demonstrate that attempting to edit Bashar Jondir's reports returns `403 Forbidden`.

#### 5. Suspended Account (Security Testing)
- **Role:** `user` (Banned)
- **Email:** `spammer@univ.edu`
- **Password:** `Pass123!`
- **Full Name:** Campus Spammer
- **Status:** Banned with documented reason: *"Repeated spam or false reports"*. Attempting to log in returns `403 Forbidden`.
