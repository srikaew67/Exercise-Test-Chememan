# Employee Management Web App

Full-stack web application for managing employee data — built with **NestJS**, **React**, and **PostgreSQL**.

---

## Features

- **Employee Table** — paginated, server-side sortable (ID, Name, Salary, Join Date, Status, Last Updated Date)
- **Search & Filter** — live search by name (debounced 300 ms), filter by department, filter by status
- **CRUD Operations** — Create, Read, Update, Delete employees via modal dialogs (Admin only)
- **Department Management** — Full CRUD for departments (Admin only)
- **Excel Import** — Upload `.xlsx` with parse + validation preview before committing (Admin only)
- **Excel Export** — Download filtered data as `.xlsx`, always sorted by ID ascending
- **Role-Based Access Control** — `ADMIN` can create/edit/delete; `USER` has read-only access
- **JWT Authentication** — Stateless auth with configurable expiry; protected routes on frontend

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | NestJS 12, Prisma ORM 6, PostgreSQL 16, ExcelJS, Passport JWT |
| **Frontend** | React 19, Vite 8, TypeScript, Tailwind CSS 3, shadcn/ui |
| **State / Data** | TanStack Query v5, React Hook Form, Zod |
| **Table** | TanStack Table v9 |
| **Infrastructure** | Docker Compose (PostgreSQL + pgAdmin) |
| **Testing** | Vitest 4, @nestjs/testing |
| **Linting** | Oxlint (backend), ESLint (frontend) |

---

## Prerequisites

- **Node.js** 20+
- **Docker Desktop** (for PostgreSQL)
- **npm**

---

## Quick Start

### 1. Start the Database

```bash
docker-compose up -d
```

| Service | URL / Port |
|---|---|
| PostgreSQL | `localhost:5433` |
| pgAdmin | http://localhost:5050 |

pgAdmin login: `admin@admin.com` / `adminpassword`

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env        # configure environment variables if needed
npm install
npm run prisma:generate     # generate Prisma client
npm run prisma:migrate      # run database migrations
npm run prisma:seed         # seed admin user and departments
npm run start:dev           # start dev server at http://localhost:3000
```

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env        # configure API URL if needed
npm install
npm run dev                 # start dev server at http://localhost:5173
```

---

## Default Credentials

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `ChangeMe123!` |
| Role | `ADMIN` |

---

## Environment Variables

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:mysecretpassword@localhost:5433/mydb` | PostgreSQL connection string |
| `JWT_SECRET` | `change_me_in_production` | JWT signing secret — **change in production** |
| `JWT_EXPIRES_IN` | `24h` | JWT token expiry duration |
| `PORT` | `3000` | Backend HTTP server port |

### `frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend API base URL |

---

## API Reference

```
POST   /auth/login               Public     — Authenticate, returns JWT token
GET    /auth/me                  Auth       — Returns current user profile & role

GET    /departments              Auth       — List all departments
POST   /departments              Admin      — Create a new department
PATCH  /departments/:id          Admin      — Update a department
DELETE /departments/:id          Admin      — Delete department (409 if employees assigned)

GET    /employees                Auth       — List employees (paginated, filterable, sortable)
GET    /employees/export         Auth       — Download employees as .xlsx (sorted by ID ASC)
GET    /employees/:id            Auth       — Get a single employee by ID
POST   /employees                Admin      — Create a single employee
POST   /employees/import         Admin      — Parse & validate an .xlsx file (returns preview)
POST   /employees/import/commit  Admin      — Bulk upsert validated rows from import
PATCH  /employees/:id            Admin      — Update an employee
DELETE /employees/:id            Admin      — Delete an employee
```

### `GET /employees` Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Case-insensitive name search |
| `departmentId` | string (UUID) | Filter by department |
| `status` | `ACTIVE` \| `INACTIVE` | Filter by status |
| `page` | number | Page number (default: `1`) |
| `limit` | number | Items per page (default: `20`) |
| `sortBy` | string | `empCode`, `name`, `salary`, `joinDate`, `status`, `lastUpdatedDate` |
| `order` | `asc` \| `desc` | Sort direction (default: `asc`) |

---

## Excel Import Format

The `.xlsx` file must contain these column headers:

| Column | Type | Notes |
|---|---|---|
| `ID` | string / number | Maps to `empCode` — upsert key (e.g. `101`) |
| `Name` | string | Full employee name |
| `Department` | string | Matched by name **or** code, case-insensitive (e.g. `Engineering`, `ENG`) |
| `Salary` | number | Numeric or formatted string (e.g. `65,000.00`) |
| `Join Date` | date | Excel date, ISO string, or formatted string (e.g. `15-Jan-23`) |
| `Status` | string | `Active` / `In Active` / `Inactive` / `ACTIVE` / `INACTIVE` |
| `Last Updated Date` | date | Same format as Join Date |

**Import behaviour:**
- Rows with unresolvable departments or invalid data appear in a preview as errors and are **excluded** from import.
- Valid rows are upserted on `empCode` — existing records are updated, new records are created.

### Sample Data

```
ID    Name         Department              Salary       Join Date    Status      Last Updated Date
101   John Doe     Engineering             65,000.00    15-Jan-23    Active      10-Jan-26
102   Jane Smith   Finance                 55,000.00    01-Feb-23    In Active   12-Jan-26
103   Bob Wilson   Information Technology  72,000.00    10-Mar-22    Active      08-Jan-26
```

---

## Data Model

```
User
  id, email, passwordHash, role (ADMIN | USER)

Department
  id, name (unique), code (unique, optional)

Employee
  id (UUID), empCode (unique), name
  departmentId → Department
  salary (Decimal 12,2), joinDate (Date)
  status (ACTIVE | INACTIVE | RESIGNED | ON_LEAVE)
  lastUpdatedDate  — auto-set on create/update, never manually inputted
  createdById → User, updatedById → User
```

### Display Conventions

| Field | Format | Example |
|---|---|---|
| Salary | Comma-separated, 2 decimals | `65,000.00` |
| Join Date | `DD-MMM-YY` (UTC) | `15-Jan-23` |
| Last Updated Date | `DD-MMM-YY` (UTC) | `10-Jan-26` |
| Status | Title case | `Active`, `In Active` |

---

## Project Structure

```
Exercise-Test-Chememan/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma data model
│   │   └── seed.ts             # Seeds admin user and departments
│   └── src/
│       ├── auth/               # JWT auth (login, strategy, guard)
│       ├── common/             # Guards, decorators (RolesGuard, CurrentUser)
│       ├── departments/        # Departments CRUD module
│       ├── employees/          # Employees CRUD + import/export endpoints
│       │   └── dto/            # Validated request DTOs
│       ├── excel/              # ExcelJS import parsing & export generation
│       ├── prisma/             # PrismaService wrapper
│       ├── app.module.ts
│       └── main.ts
└── frontend/
    └── src/
        ├── components/
        │   ├── ui/             # shadcn/ui component primitives
        │   ├── EmployeeTable/  # TanStack Table with sortable columns
        │   ├── EmployeeModal/  # Add / Edit employee form (React Hook Form + Zod)
        │   ├── ImportModal/    # 3-step Excel import (upload → preview → commit)
        │   └── Layout/         # App shell with sidebar navigation
        ├── hooks/              # useAuth, useEmployees, useDepartments
        ├── lib/                # Axios instance (api.ts)
        ├── pages/              # LoginPage, DashboardPage, EmployeesPage, DepartmentsPage
        └── schemas/            # Zod schemas for form validation
```

---

## Development Commands

### Backend

```bash
npm run start:dev        # Start with hot-reload
npm run build            # Compile TypeScript
npm run test             # Run unit tests (Vitest)
npm run lint             # Run Oxlint
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Apply pending migrations
npm run prisma:seed      # Re-seed admin user and departments
```

### Frontend

```bash
npm run dev              # Start Vite dev server
npm run build            # Type-check + production build
npm run lint             # Run ESLint
```

---

## Testing

Unit tests are written with **Vitest** and `@nestjs/testing`, covering:

- `EmployeesService` — `upsertMany` edge cases (empty, null, batch)
- `EmployeesController` — route wiring and guard behaviour
- `ExcelService` — import row parsing, date handling, department resolution, status normalization

```bash
npm --prefix backend test
```