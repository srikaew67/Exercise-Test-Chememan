# Employee Management Web App — Design Spec

**Date:** 2026-09-09  
**Status:** Approved

---

## Overview

A full-stack employee management application. Admins import employees from Excel, manage departments, and perform full CRUD. Regular users get read-only access. Authentication is JWT-based with role-aware UI.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Data fetching | TanStack Query v5 |
| Table | TanStack Table v8 |
| Forms | React Hook Form + Zod |
| Backend | NestJS + TypeScript |
| ORM | Prisma v5 |
| Database | PostgreSQL 16 (Docker, port 5433) |
| Auth | JWT via Passport.js |
| Excel | exceljs |

---

## Project Structure

```
C:\Project\Exercise-Test-Chememan\
├── docker-compose.yml
├── README.md
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       (provided by user)
│   │   └── seed.ts             (provided by user)
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── common/
│       │   ├── guards/         (JwtAuthGuard, RolesGuard)
│       │   └── decorators/     (@Roles, @CurrentUser)
│       ├── auth/
│       ├── departments/
│       ├── employees/
│       └── excel/
└── frontend/
    └── src/
        ├── lib/                (api.ts, queryClient.ts)
        ├── schemas/            (zod schemas)
        ├── hooks/              (useAuth, useEmployees, useDepartments)
        ├── pages/              (Login, Dashboard, Employees, Departments)
        └── components/         (Layout, EmployeeTable, EmployeeModal, ImportModal, DepartmentTable)
```

---

## Database Schema (reference only — do not modify without flagging reason)

Models: User, Department, Employee  
Enums: Role (ADMIN | USER), Status (ACTIVE | INACTIVE)  
Key fields: Employee.empCode (unique, from Excel), departmentId FK, createdById FK, updatedById FK

---

## API Contract

### Auth
```
POST /auth/login   body: { email, password } -> { access_token }
GET  /auth/me      -> { id, email, role }
```

### Departments
```
GET    /departments
POST   /departments          (Admin)
PATCH  /departments/:id      (Admin)
DELETE /departments/:id      (Admin, 409 if employees reference it)
```

### Employees
```
GET    /employees   ?search=&departmentId=&status=&page=&limit=&sortBy=&order=
GET    /employees/:id
POST   /employees            (Admin)
PATCH  /employees/:id        (Admin)
DELETE /employees/:id        (Admin)
POST   /employees/import     (Admin, multipart .xlsx) -> ImportPreviewDto
POST   /employees/import/commit  (Admin, body: ImportPreviewDto) -> { upserted: N }
GET    /employees/export     (?same filters) -> .xlsx download
```

### ImportPreviewDto shape
```typescript
interface ImportPreviewDto {
  validRows: ValidatedEmployeeRow[];
  invalidRows: InvalidRow[];
}
interface ValidatedEmployeeRow {
  empCode: string; name: string; departmentId: number;
  salary: number; joinDate: string; status: string; lastUpdatedDate: string;
}
interface InvalidRow {
  rowNumber: number; rawData: Record<string, unknown>; reasons: string[];
}
```

---

## RBAC

| Action | ADMIN | USER |
|---|---|---|
| View employees / departments | YES | YES |
| Create / Edit / Delete employee | YES | NO |
| Import Excel | YES | NO |
| Export Excel | YES | YES |
| Manage departments | YES | NO |

Backend: JwtAuthGuard globally + RolesGuard + @Roles('ADMIN') on write endpoints  
Frontend: isAdmin from /auth/me hides/disables admin-only elements

---

## Import Flow

1. Admin uploads .xlsx via POST /employees/import
2. ExcelService reads rows, validates fields, looks up department by name
3. Unmatched department names go to invalidRows (not auto-created)
4. Preview returned (no DB writes)
5. Admin reviews modal: success count + invalid rows with reasons
6. Confirm -> POST /employees/import/commit -> upserts on empCode

---

## Search & Filter

- search: name ILIKE '%query%' (Prisma contains, mode insensitive)
- departmentId: exact FK match
- status: exact enum match
- sortBy: name, empCode, salary, joinDate, status; order: asc|desc
- page + limit: default 1 / 20

---

## Environment Variables

### backend/.env
```
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5433/mydb"
JWT_SECRET="change_me_in_production"
JWT_EXPIRES_IN="24h"
PORT=3000
```

### frontend/.env
```
VITE_API_URL=http://localhost:3000
```

---

## Out of Scope

- Password reset, email notifications, audit logging
- Roles beyond ADMIN / USER
- User management UI (sidebar link reserved, page not implemented)
- Schema changes without prior flag
