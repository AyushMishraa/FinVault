# Finance Dashboard Backend

A production-ready REST API for a multi-role finance dashboard, built with **Node.js · Express · TypeScript · MongoDB**.

---

## Table of Contents
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Role Permissions](#role-permissions)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Design Decisions & Assumptions](#design-decisions--assumptions)
- [Project Structure](#project-structure)

---

## Tech Stack

| Concern | Library |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Language | TypeScript 5 |
| Database | MongoDB (Mongoose 8) |
| Auth | JWT (`jsonwebtoken`) |
| Validation | Zod |
| Password hashing | bcryptjs (12 rounds) |
| Security | Helmet · CORS · express-rate-limit |
| Logging | Morgan |

---

## Architecture

```
Request
  → Rate limiter
  → Helmet / CORS
  → Router
    → validate()      ← Zod schema (coerces query strings to numbers etc.)
    → authenticate()  ← verifies JWT, re-checks user status in DB
    → authorize()     ← role guard
    → Controller      ← thin HTTP layer, delegates to Service
      → Service       ← all business logic lives here
        → Mongoose    ← data access
  ← ApiResponse.success / ApiResponse.created
  ← errorHandler (catches ApiError + Mongoose errors → uniform JSON)
```

**Separation of concerns:**
- `types/`       — shared enums and interfaces, no business logic
- `models/`      — Mongoose schema definitions only
- `validators/`  — Zod schemas, input shapes only
- `middleware/`  — cross-cutting concerns (auth, RBAC, validation, errors)
- `services/`    — all business rules and DB queries
- `controllers/` — parse HTTP request → call service → send HTTP response
- `routes/`      — wire controllers + middleware per endpoint

---

## Role Permissions

| Action | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| List users | ✅ active only | ✅ active only | ✅ all |
| Update / toggle any user | ❌ | ❌ | ✅ |
| **Create** financial record | ❌ | ✅ | ✅ |
| **View** records | ✅ own | ✅ own | ✅ all |
| **Update** record | ❌ | ✅ own | ✅ any |
| **Delete** record (soft) | ❌ | ✅ own | ✅ any |
| Dashboard summary | ✅ own | ✅ own | ✅ global |
| Category totals | ✅ own | ✅ own | ✅ global |
| Recent activity | ✅ own | ✅ own | ✅ global |
| Monthly trends | ❌ | ✅ own | ✅ global |
| Weekly trends | ❌ | ✅ own | ✅ global |

---

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local installation or a free Atlas cluster)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Open .env and set MONGODB_URI and JWT_SECRET

# 3. (Optional) Seed demo data
npm run seed

# 4. Start development server with hot-reload
npm run dev
```

Server starts at **http://localhost:5000**.

### Demo credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@finance.dev | Admin@1234 |
| Analyst | analyst@finance.dev | Analyst@1234 |
| Viewer | viewer@finance.dev | Viewer@1234 |

> **Bootstrap note:** the very first user to register on a fresh database automatically receives the `admin` role, so you never need to manually set up an admin account.

---

## API Reference

### Envelope

Every response uses the same shape:

```json
{
  "success": true,
  "message": "Human-readable status",
  "data":    { ... },
  "errors":  [ { "field": "email", "message": "Invalid email address" } ],
  "meta":    { "pagination": { ... } }
}
```

`errors` is present only on 400 validation failures.  
`meta` is present only on paginated list endpoints.

### Authentication

All protected routes require:
```
Authorization: Bearer <token>
```

---

### Auth — `/api/auth`

#### `POST /api/auth/register`
**Public.** Create a new account.

```jsonc
// Body
{ "name": "Jane", "email": "jane@example.com", "password": "secret123", "role": "viewer" }
// role is optional — defaults to "viewer"
```

Response `201`:
```json
{ "success": true, "message": "Account created successfully",
  "data": { "user": { "_id": "...", "name": "Jane", "role": "viewer" }, "token": "eyJ..." } }
```

---

#### `POST /api/auth/login`
**Public.**

```json
{ "email": "jane@example.com", "password": "secret123" }
```

Response `200`:
```json
{ "success": true, "data": { "user": { ... }, "token": "eyJ..." } }
```

---

#### `GET /api/auth/me`  🔒
Returns the authenticated user's token payload.

---

### Users — `/api/users`

#### `GET /api/users` 🔒
List users.  Admins see all; others see only active users.

#### `GET /api/users/:id` 🔒
Get user by ID.  Non-admins can only fetch themselves.

#### `PATCH /api/users/:id` 🔒 Admin only
Update name, role, or status.

```json
{ "name": "New Name", "role": "analyst", "status": "inactive" }
```

#### `PATCH /api/users/:id/toggle-status` 🔒 Admin only
Flip `active` ↔ `inactive`.

---

### Financial Records — `/api/records`

#### `POST /api/records` 🔒 Analyst, Admin

```json
{
  "amount": 2500,
  "type": "income",
  "category": "salary",
  "date": "2024-06-15",
  "notes": "June salary"
}
```

**Valid types:** `income` | `expense`

**Valid categories:** `salary` `freelance` `investment` `rent` `utilities` `groceries` `healthcare` `entertainment` `transport` `education` `insurance` `loan` `tax` `other`

---

#### `GET /api/records` 🔒 All roles
Paginated list with rich filtering.

| Query param | Type | Default | Description |
|---|---|---|---|
| `type` | `income\|expense` | — | Filter by type |
| `category` | string | — | Filter by category |
| `startDate` | `YYYY-MM-DD` | — | From this date |
| `endDate` | `YYYY-MM-DD` | — | Up to this date (inclusive) |
| `minAmount` | number | — | Minimum amount |
| `maxAmount` | number | — | Maximum amount |
| `search` | string | — | Full-text search in notes |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Page size (max 100) |
| `sortBy` | string | `date` | `date\|amount\|category\|type\|createdAt` |
| `sortOrder` | string | `desc` | `asc\|desc` |

Response includes pagination in `meta`:
```json
{
  "meta": {
    "pagination": {
      "total": 85, "page": 1, "limit": 10,
      "totalPages": 9, "hasNextPage": true, "hasPrevPage": false
    }
  }
}
```

---

#### `GET /api/records/:id` 🔒 All roles (owner or Admin)
#### `PATCH /api/records/:id` 🔒 Analyst (own), Admin (any)
#### `DELETE /api/records/:id` 🔒 Analyst (own), Admin (any)
Soft-delete — the record is marked `isDeleted: true` and excluded from all future queries automatically.

---

### Dashboard — `/api/dashboard`

#### `GET /api/dashboard/summary` 🔒 All roles

Optional query: `?startDate=2024-01-01&endDate=2024-12-31`

```json
{
  "data": {
    "totalIncome": 15000.00,
    "totalExpenses": 8750.50,
    "netBalance": 6249.50,
    "recordCount": 42,
    "incomeCount": 18,
    "expenseCount": 24
  }
}
```

---

#### `GET /api/dashboard/categories` 🔒 All roles

Optional: `?startDate=&endDate=`

```json
{
  "data": [
    { "category": "salary",  "type": "income",  "total": 10000, "count": 2 },
    { "category": "rent",    "type": "expense", "total": 3000,  "count": 3 }
  ]
}
```

---

#### `GET /api/dashboard/recent` 🔒 All roles

Optional: `?limit=10` (max 50)

---

#### `GET /api/dashboard/trends/monthly` 🔒 Analyst, Admin

Optional: `?months=12`

```json
{
  "data": [
    { "year": 2024, "month": 1, "monthLabel": "Jan 2024",
      "income": 5000, "expenses": 3200, "net": 1800 }
  ]
}
```

---

#### `GET /api/dashboard/trends/weekly` 🔒 Analyst, Admin

Optional: `?weeks=8`

---

## Data Models

### User
```
_id        ObjectId
name       String  (2–100 chars)
email      String  (unique, lowercase)
password   String  (bcrypt-hashed, never returned in responses)
role       "viewer" | "analyst" | "admin"
status     "active" | "inactive"
createdAt  Date
updatedAt  Date
```

### FinancialRecord
```
_id        ObjectId
amount     Number  (> 0)
type       "income" | "expense"
category   Enum    (14 values)
date       Date
notes      String? (max 500 chars)
createdBy  ObjectId → User
isDeleted  Boolean (soft-delete flag, hidden from all responses)
deletedAt  Date?   (set when soft-deleted)
createdAt  Date
updatedAt  Date
```

---

## Design Decisions & Assumptions

### Soft delete
Records are never permanently removed — `isDeleted: true` is set instead. A Mongoose query middleware (`pre(/^find/)`) silently filters these out from every `find*` operation, so no caller has to remember to add the filter. Deleted records remain in the DB for audit purposes.

### First-user bootstrap
The very first `POST /api/auth/register` call on an empty database automatically produces an admin account. This avoids a chicken-and-egg problem where you need an admin to create other admins.

### Data scoping in services, not routes
Record visibility (own vs all) is enforced inside `RecordService` and `DashboardService`, not as a route-level guard. This keeps the rule in one place and makes it easy to extend.

### Analyst write access
Analysts can create, update, and soft-delete records they own. Viewers are strictly read-only. This felt like the most natural interpretation of the role descriptions.

### Trend endpoints scoped to Analyst+
Monthly and weekly trends are richer analytics; viewers get summary + recent activity only.

### Admin safety guards
`UserService.update` checks two conditions before allowing a change:
1. Cannot demote the **last** admin.
2. Cannot deactivate the **last active** admin.
Both prevent accidentally locking the system.

### Rate limiting
- Global: 100 req / 15 min per IP.
- Auth endpoints: 10 req / 15 min per IP (brute-force protection on login/register).

### JWT re-validation on every request
`authenticate` middleware queries the DB on every request to confirm the user still exists and is active. This ensures a deactivated user's token is immediately rejected rather than remaining valid until expiry.

---

## Project Structure

```
finance-api/
├── src/
│   ├── config/
│   │   └── database.ts            # MongoDB connect / disconnect
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── record.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification + user status check
│   │   ├── error.middleware.ts     # Global error handler + 404
│   │   ├── role.middleware.ts      # authorize() / authorizeMinRole()
│   │   └── validate.middleware.ts  # Zod validation factory
│   ├── models/
│   │   ├── record.model.ts
│   │   └── user.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── record.routes.ts
│   │   └── user.routes.ts
│   ├── scripts/
│   │   └── seed.ts                # Demo-data seeder
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── record.service.ts
│   │   └── user.service.ts
│   ├── types/
│   │   └── index.ts               # Shared enums + interfaces
│   ├── utils/
│   │   ├── ApiError.ts
│   │   └── ApiResponse.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── record.validator.ts
│   ├── app.ts                     # Express app config + middleware wiring
│   └── server.ts                  # Entry point + graceful shutdown
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```
