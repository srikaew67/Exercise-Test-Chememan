# AGENTS.md

Instructions and guidelines for AI coding agents working on the **Employee Management Web App (Exercise-Test-Chememan)** repository.

---

## 1. Project Overview & Architecture

Full-stack employee management platform with bulk Excel import/export capabilities, role-based access control, and dynamic data presentation.

### Tech Stack
- **Backend:** NestJS (v12), Prisma ORM (v6), PostgreSQL, Vitest (v4), Oxlint, ExcelJS.
- **Frontend:** React (v19), Vite (v8), Tailwind CSS (v3), TypeScript (~v6), TanStack Table (v9), TanStack Query (v5), React Hook Form, Zod.
- **Database / Infrastructure:** PostgreSQL container running via Docker Compose (`port: 5433`).

---

## 2. Core Business Rules & Domain Conventions

1. **Employee Status:**
   - Display & Form options are strictly **`Active`** and **`In Active`**.
   - In database and backend Prisma enum: stored as `ACTIVE` and `INACTIVE`.
   - Excel Import accepts variations: `Active`, `In Active`, `Inactive`, `ACTIVE`, `INACTIVE`.

2. **Last Updated Date (`lastUpdatedDate`):**
   - **Never manually inputted in Add/Edit Employee modal.**
   - Server-side automatically sets `lastUpdatedDate = new Date()` whenever an employee is created or updated.
   - Displayed in the table formatted as `DD-MMM-YY` (e.g. `10-Jan-26`), with ASC/DESC sorting capability.

3. **Data Display Formatting (Matches Excel):**
   - **Salary:** Formatted with commas and 2 decimals (`65,000.00`).
   - **Dates (Join Date, Last Updated Date):** Formatted as `DD-MMM-YY` (e.g. `15-Jan-23`, `10-Jan-26`) using UTC methods to prevent timezone shifts.
   - **Status:** Title Case (`Active`, `In Active`).

4. **Excel Import / Export:**
   - Columns: `ID`, `Name`, `Department`, `Salary`, `Join Date`, `Status`, `Last Updated Date`.
   - Department matching: Case-insensitive lookup supporting department `name` or `code` (e.g. `Engineering`, `ENG`, `Information Technology`, `IT`).
   - Date parsing supports JS Date objects, ISO strings, formatted strings, and Excel serial date numbers.

5. **Sorting:**
   - Table sorting state is managed atomically (`sort: { sortBy, order }`) to prevent race conditions or toggle resets in React StrictMode.
   - Sortable fields: `empCode`, `name`, `salary`, `joinDate`, `status`, `lastUpdatedDate`.

---

## 3. Essential Commands

### Backend (`/backend`)
```bash
# Run unit tests
npm run test

# Run linter
npm run lint

# Compile and build
npm run build

# Generate Prisma client
npm run prisma:generate

# Apply migrations
npm run prisma:migrate

# Seed initial admin and departments
npm run prisma:seed
```

### Frontend (`/frontend`)
```bash
# Run linter
npm run lint

# Type-check and production build
npm run build

# Start development server
npm run dev
```

---

## 4. Guidelines for Future Changes

- **Verification Before Completion:** Always verify changes by running `npm --prefix backend test` and `npm --prefix frontend run build`.
- **Database Integrity:** Do not delete migrations or schema files without reviewing existing relations.
- **UI Consistency:** Ensure inputs in modals maintain aligned padding (e.g. `px-3`), matching icons between dropdowns and date pickers.
