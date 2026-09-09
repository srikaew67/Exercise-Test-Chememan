# Employee Management Web App

Full-stack employee management application.
- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui

## Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)
- npm

## Quick Start

### 1. Start PostgreSQL
```bash
docker-compose up -d
```
PostgreSQL runs on port **5433**, pgAdmin runs on port **5050**.

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env if needed
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run start:dev
```
Backend API server: **http://localhost:3000**

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend development server: **http://localhost:5173**

## Default Credentials
- Email: `admin@example.com`
- Password: `ChangeMe123!`

## Environment Variables

### backend/.env
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:mysecretpassword@localhost:5433/mydb` | PostgreSQL connection string |
| `JWT_SECRET` | `change_me_in_production` | JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | JWT token expiration duration |
| `PORT` | `3000` | Backend server port |

### frontend/.env
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend API base URL |

## API Reference
```
POST   /auth/login               Public - Authenticate with email & password, returns JWT
GET    /auth/me                  Authenticated - Returns current user profile & role

GET    /departments              Authenticated - List all departments
POST   /departments              Admin - Create a new department
PATCH  /departments/:id          Admin - Update an existing department
DELETE /departments/:id          Admin - Delete a department (409 Conflict if referenced by employees)

GET    /employees                Authenticated - Query employees (filters: search, departmentId, status, page, limit, sortBy, order)
GET    /employees/export         Authenticated - Download Excel (.xlsx) of employees respecting active filters
GET    /employees/:id            Authenticated - Get employee details by ID
POST   /employees                Admin - Create a single employee
POST   /employees/import         Admin - Upload and validate Excel file (multipart/form-data)
POST   /employees/import/commit  Admin - Bulk upsert validated rows from import preview
PATCH  /employees/:id            Admin - Update employee details
DELETE /employees/:id            Admin - Delete an employee
```

## Excel Import Format
| Column | Type | Notes |
|---|---|---|
| ID | string / number | Maps to `empCode` — unique upsert key (e.g. `101`) |
| Name | string | Full employee name (e.g. `John Doe`) |
| Department | string | Matches department name or code (e.g. `Engineering`, `Information Technology` / `IT`) |
| Salary | number | Numeric value or formatted string (e.g. `65,000.00`) |
| Join Date | date | Formatted date string (e.g. `15-Jan-23`, `2023-01-15`) or Excel date |
| Status | string | `Active` or `In Active` (case-insensitive, also accepts `ACTIVE` / `INACTIVE`) |
| Last Updated Date | date | Formatted date string (e.g. `10-Jan-26`, `2026-01-10`) or Excel date |

### Sample Excel Data
```text
ID    Name        Department     Salary       Join Date    Status       Last Updated Date
101   John Doe    Engineering    65,000.00    15-Jan-23    Active       10-Jan-26
102   Jane Smith  Finance        55,000.00    01-Feb-23    In Active    12-Jan-26
```

> **Notes:**
> - Department names/codes are checked case-insensitively. Unmatched departments appear as errors in the preview.
> - On the Add/Edit Employee modal, `Last Updated Date` is handled automatically by the server based on the timestamp of creation/modification.
> - Table columns support ascending/descending toggle sorting (`ID`, `Name`, `Salary`, `Join Date`, `Status`, `Last Updated Date`).

## Project Structure
```
Exercise-Test-Chememan/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── auth/
│       ├── common/
│       ├── departments/
│       ├── employees/
│       ├── excel/
│       ├── prisma/
│       ├── app.module.ts
│       └── main.ts
└── frontend/
    └── src/
        ├── components/
        │   ├── ui/
        │   ├── EmployeeTable/
        │   ├── EmployeeModal/
        │   ├── ImportModal/
        │   ├── ConfirmDialog/
        │   ├── Layout/
        │   └── ProtectedRoute/
        ├── context/
        ├── hooks/
        ├── lib/
        ├── pages/
        ├── schemas/
        └── types/
```

## Testing & Verification
- **Backend Tests:** `cd backend; npm run test`
- **Backend Lint:** `cd backend; npm run lint`
- **Backend Build:** `cd backend; npm run build`
- **Frontend Build:** `cd frontend; npm run build`
- **Frontend Lint:** `cd frontend; npm run lint`