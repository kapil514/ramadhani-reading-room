# Ramadhani Reading Room — Management System

A web-based management system for a private reading room / study space business. Handles student registrations, cabin & locker assignments, memberships, payments, and analytics.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, TailwindCSS, shadcn/ui, Lucide Icons |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (httpOnly cookies), bcrypt |
| Validation | Zod (client + server) |
| Forms | React Hook Form |

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set DATABASE_URL and JWT_SECRET
```

### 3. Run migrations & seed cabins/lockers
```bash
npm run db:migrate --workspace=apps/api
npm run db:seed --workspace=apps/api
```
Default admin credentials:
- **Email**: `admin@readingroom.com`
- **Password**: `Admin@1234`

### 4. (Optional) Seed student data from seating sheet
```bash
cd apps/api
npx ts-node --project tsconfig.json --transpile-only prisma/seed-students.ts
```
This imports 50 students with cabin/locker assignments from the Excel seating sheet. Safe to re-run (idempotent).

### 5. Start development servers
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Implemented Modules

| Module | Status |
|---|---|
| Authentication (JWT, roles, change password) | ✅ |
| Enquiry & lead management (Kanban board) | ✅ |
| Student registration (full admission form) | ✅ |
| Student detail & membership history | ✅ |
| Cabin grid — visual occupancy, assign, release, reassign | ✅ |
| Locker management — assign & release | ✅ |
| Cabin pricing (monthly rate per room/category) | ✅ |
| Membership management (amountDue auto-fill) | ✅ |
| Payments — record, invoice number, pre-fill from price | ✅ |
| Reports dashboard — KPIs, revenue trend, breakdowns | ✅ |

## Cabin Pricing

| Category | Room | Monthly |
|---|---|---|
| RRR 1.0 | General | ₹1,250 |
| RRR 1.0 | NON AC Premium | ₹2,500 |
| RRR 1.0 | Deluxe Room 1 | ₹2,100 |
| RRR 1.0 | Deluxe Room 2 | ₹2,800 |
| RRR 1.0 | AC Premium | ₹3,000 |
| RRR 2.0 | General | ₹1,500 |
| RRR 2.0 | Elite | ₹1,850 |
| RRR 2.0 | Pvt-1 / Pvt-2 | ₹6,000 |

## Project Structure
```
apps/
  api/
    src/routes/     → auth, users, enquiries, students, cabins, lockers, payments, reports
    src/middleware/ → auth, errorHandler
    src/lib/        → prisma client
    prisma/
      schema.prisma
      seed.ts             ← cabins + lockers
      seed-students.ts    ← student data from seating sheet
  web/
    src/pages/      → LoginPage, DashboardPage, EnquiriesPage, StudentsPage,
                       StudentFormPage, StudentDetailPage, CabinsPage,
                       PaymentsPage, ReportsPage
    src/components/ → shadcn/ui components + layout (AppShell)
    src/contexts/   → AuthContext
    src/lib/        → api.ts, utils.ts
    src/types/      → index.ts (shared TypeScript interfaces)
```
