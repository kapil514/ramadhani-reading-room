# Software Specification — Ramadhani Reading Room Management System

## 1. Overview

**Product Name**: Ramadhani Reading Room Management System  
**Business**: Ramadhani Reading Room — a private learning-space service that rents out desks/cabins to students for study purposes.  
**Platform**: Web application (browser-based)  
**Tech Stack**:
- **Frontend**: React + TypeScript, TailwindCSS, shadcn/ui, Recharts, Lucide Icons
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: JWT-based staff/admin login

---

## 2. Goals

- Manage student enquiries and track lead conversion status.
- Register new students with complete profile and document details.
- Assign and track cabin and locker allocations.
- Manage membership periods, payments, and invoices.
- Provide a visual dashboard with cabin occupancy at a glance.
- Generate monthly accounting reports with graphical income summaries.

---

## 3. User Roles

| Role | Description |
|---|---|
| `Admin` | Full access — manage students, cabins, payments, reports, settings |
| `Staff` | Register students, record payments, manage enquiries |

---

## 4. Modules

### 4.1 Authentication & Admin Access

**Purpose**: Secure the application so only authorised staff and admins can access it.

#### 4.1.1 Login
- Dedicated `/login` page — the only publicly accessible route.
- Login form fields:
  - Email address *(required)*
  - Password *(required)*
  - "Remember me" checkbox (extends session to 30 days)
- On successful login: JWT access token issued and stored in `httpOnly` cookie; user redirected to Dashboard.
- On failed login: generic error message shown (`Invalid email or password`).
- Brute-force protection: account locked for 15 minutes after 5 consecutive failed login attempts.

#### 4.1.2 Session Management
- JWT access token expiry: **8 hours** (or 30 days if "Remember me" is checked).
- All API routes protected by `authMiddleware` — returns `401` if token is missing or invalid.
- Logout clears the `httpOnly` cookie and invalidates the session.
- Unauthenticated users attempting to access any protected route are redirected to `/login`.

#### 4.1.3 Role-Based Access Control (RBAC)

| Permission | Admin | Staff |
|---|---|---|
| View Dashboard | ✅ | ✅ |
| Manage Enquiries | ✅ | ✅ |
| Register Students | ✅ | ✅ |
| Edit / Delete Students | ✅ | ✅ |
| Assign Cabins & Lockers | ✅ | ✅ |
| Record Payments | ✅ | ✅ |
| View Reports & Accounting | ✅ | ❌ |
| Export Reports (PDF/CSV) | ✅ | ❌ |
| Manage Users (add/edit staff) | ✅ | ❌ |
| App Settings | ✅ | ❌ |
| Delete Records | ✅ | ❌ |

#### 4.1.4 Admin User Management (`/settings/users`)
- **Admin only** — accessible under Settings.
- View all staff/admin accounts.
- Create new user: name, email, password (auto-generated or manual), role (`ADMIN` / `STAFF`).
- Edit user: update name, email, role, active status.
- Deactivate / reactivate user (deactivated users cannot log in).
- Reset password: admin can trigger a password reset for any user.

#### 4.1.5 Password Management
- Passwords stored as `bcrypt` hashes (salt rounds: 12).
- **Change password**: any logged-in user can change their own password from the profile menu.
  - Fields: current password, new password, confirm new password.
  - Minimum password strength: 8 characters, at least one uppercase, one number.
- **Forgot password**: Not in v1 (no email server required) — admin resets passwords manually via User Management.

#### 4.1.6 Profile Menu
- Accessible from the top-right corner on all pages.
- Shows logged-in user's name and role badge.
- Options: **Change Password**, **Logout**.

---

### 4.2 Dashboard (Home)

**KPI Cards:**
- Total active students
- Vacant cabins count
- Today's follow-ups count
- Monthly revenue (current month)

**Widgets:**
- Cabin visual grid (quick occupancy snapshot)
- Recent registrations feed (last 5–10 students)
- Upcoming membership expiries (next 7 days)

---

### 4.3 Enquiry & Lead Management

**Purpose**: Capture walk-in enquiries and track conversion.

**Lead Statuses (3 states):**
| Status | Description |
|---|---|
| `NOT_INTERESTED` | Student came, enquired, but is not interested |
| `FOLLOW_UP` | Student is interested but has not joined yet — needs follow-up |
| `JOINED` | Student enquired and has completed registration |

**Enquiry Form Fields:**
- Full name *(required)*
- Phone number *(required)*
- Email *(optional)*
- Course / Exam pursuing *(required)*
- Enquiry date *(auto-filled, editable)*
- Lead status *(default: `FOLLOW_UP`)*
- Notes / Remarks *(optional)*
- Last follow-up date *(updated on each contact)*

**Views:**
- Kanban board with columns per status (NOT_INTERESTED / FOLLOW_UP / JOINED)
- List view with search and filter by status, date range
- Convert enquiry → New Student Registration (one-click promotion)

---

### 4.4 Student Registration

**Purpose**: Register a new student and maintain their full profile.

#### 4.4.1 Personal Details
- Full name *(required)*
- Gender: `MALE` | `FEMALE` | `OTHER` *(optional)*
- Phone number *(required, unique)*
- Alternate / parent phone number *(optional)*
- Email address *(optional)*
- Date of birth *(optional)*
- Home address *(optional)*
- Profile photo upload *(JPG/PNG — future)*
- Government ID type: `Aadhaar` | `PAN Card` | `Driving Licence` | `Passport` *(optional)*
- Government ID number *(optional)*
- Government ID document upload *(PDF/JPG — future)*

#### 4.4.2 Academic & Study Details
- Course / Exam pursuing *(e.g. CA, NEET, UPSC, B.Tech)*
- Year / Grade / Level of study *(e.g. Final Year, CA Final, 12th)*
- Institution name *(school / college / university)*
- Daily study hours at reading room: `1–4 hours` | `4–12 hours` | `12+ hours`
- Preferred study time: `Early Morning` | `Afternoon` | `Evening` | `Late Night` | combinations
- How did you hear about us: `Friends & Family` | `Google Maps` | `Social Media` | `Instagram` | `Banner Ad` | `Other`

#### 4.4.3 Membership Details (on registration)
- Registration date *(auto-filled)*
- Membership start date
- Membership end date (period)
- Cabin number assigned *(shows monthly price in dropdown)*
- Locker number assigned *(optional)*
- Payment status: `PAID` | `PARTIAL` | `PENDING`
- Fingerprint ID *(unique identifier string, optional)*
- Unique student ID *(auto-generated, e.g. `RRR-0001`)*

#### 4.4.4 Student Status
| Status | Description |
|---|---|
| `ACTIVE` | Currently enrolled and within membership period |
| `EXPIRED` | Membership period has ended |
| `PAUSED` | Membership temporarily on hold |
| `LEFT` | Student has permanently left |

**Student List View:**
- Search by name, phone, student ID
- Filter by status, cabin, payment status, expiry date
- Export list as CSV

---

### 4.5 Cabin & Locker Management

**Purpose**: Track all cabins and lockers — availability, assignment, expiry.

#### 4.5.1 Cabin Visual Grid
- Grid view grouped by **Room Name** (e.g. General, AC Premium, Elite, Pvt-1…), then by **Category** (RRR 1.0 / RRR 2.0).
- Color-coded status per cabin card:
  - 🟢 **Vacant** — available for assignment
  - 🔴 **Occupied** — assigned to an active student
  - 🟡 **Expiring Soon** — membership ends within 30 days
  - ⚪ **Inactive** — cabin not in service
- Each card shows: cabin number, monthly price, student name, days remaining, **Release** and **Reassign** buttons.
- Clicking a vacant cabin (or Reassign on occupied) opens the Assign modal.

#### 4.5.2 Cabin Record Fields
- Cabin number *(unique)*
- Room name *(e.g. General, NON AC Premium, Deluxe Room 1, AC Premium, Elite, Pvt-1, Pvt-2)*
- Category: `RRR 1.0` | `RRR 2.0`
- Cabin type: `Standard` | `Premium` | `AC`
- **Monthly price** *(Decimal — see pricing table in §4.5.4)*
- Status: `VACANT` | `OCCUPIED` | `EXPIRING_SOON` | `INACTIVE`
- Current membership ID *(FK, nullable)*

#### 4.5.3 Locker Management
- Independent locker list with availability status
- Link locker to a student (1 locker per student)
- Locker number, area: `General Locker` | `Elite Locker`, status: `VACANT` / `OCCUPIED`
- 20 lockers in system: L1–L5 (General), L6–L20 (Elite)

#### 4.5.4 Cabin Pricing Table
| Category | Room Name | Monthly Price |
|---|---|---|
| RRR 1.0 | General | ₹1,250 |
| RRR 1.0 | NON AC Premium | ₹2,500 |
| RRR 1.0 | Deluxe Room 1 | ₹2,100 |
| RRR 1.0 | Deluxe Room 2 | ₹2,800 |
| RRR 1.0 | AC Premium | ₹3,000 |
| RRR 2.0 | General | ₹1,500 |
| RRR 2.0 | Elite | ₹1,850 |
| RRR 2.0 | Pvt-1 | ₹6,000 |
| RRR 2.0 | Pvt-2 | ₹6,000 |

- Monthly price is stored on the `Cabin` record and automatically copied to `Membership.amountDue` when a membership is created.
- Price is displayed on cabin cards, in the Assign modal, in the student form cabin dropdown, and in the student detail membership history.

#### 4.5.5 Cabin Release & Reassignment
- **Release**: Sets cabin to `VACANT`, expires the active membership (`endDate = now`, `cabinId = null`).
- **Reassign**: Opens Assign modal on an occupied cabin; automatically expires the prior membership before creating the new one.
- Both operations are available directly from the cabin grid card.

---

### 4.6 Payment & Invoice Management

**Purpose**: Record student payments and generate invoices.

#### 4.6.1 Payment Record Fields
- Student reference
- Membership period covered (start → end)
- Amount paid *(required)*
- Payment date *(required)*
- Payment mode: `Cash` | `UPI` | `Card` | `Bank Transfer` | `Cheque`
- Transaction reference / UTR number *(optional)*
- Notes *(optional)*
- Payment status: `PAID` | `PARTIAL` | `PENDING`

#### 4.6.2 Payment Recording (implemented)
- **Search student** by name or student code — shows matching memberships with cabin and status.
- Monthly rate pre-filled from `Membership.amountDue` (derived from cabin monthly price) with a **"Use this amount"** quick-fill button.
- Payment mode selector: `Cash` | `UPI` | `Card` | `Bank Transfer` | `Cheque` with icons.
- Transaction reference field shown for non-cash modes.
- On submission: auto-generates invoice number (`INV-0001` format), sets `Membership.paymentStatus = PAID`.

#### 4.6.3 Invoice
- Auto-generate invoice number on recording a payment (`INV-XXXX` sequential)
- Invoice fields: student name, student ID, membership period, amount, payment mode, date, invoice number
- Download invoice as **PDF** *(future enhancement)*
- Send invoice via WhatsApp / Email *(future enhancement)*

#### 4.6.4 Outstanding Dues
- View students with `PARTIAL` or `PENDING` payment status
- Overdue alerts for expired memberships with pending payments

---

### 4.7 Accounting & Reports

**Purpose**: Monthly financial overview and income reporting.

#### 4.7.1 KPI Cards (implemented)
- Total / active students, new registrations this month
- This month's revenue vs last month (with trend indicator)
- Total all-time revenue
- Pending payments count
- Memberships expiring in 30 days
- Vacant / occupied cabin count

#### 4.7.2 Graphical View (implemented)
- Bar chart: Monthly revenue over last 6 months (with payment count tooltip)
- Breakdown: Revenue by payment mode (horizontal bar)
- Gender breakdown
- Top courses (top 10)
- Referral source breakdown

#### 4.7.3 Expiring Memberships Panel (implemented)
- Table of students whose membership ends within 30 days
- Shows name, student code, phone, cabin, days left
- Color-coded urgency (red ≤ 7 days, orange ≤ 30 days)

#### 4.7.4 Exports
- Download monthly report as **PDF** *(future enhancement)*
- Download payment records as **CSV** *(future enhancement)*

---

## 5. Database Schema

### `users` (staff/admin)
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | Required |
| email | VARCHAR | Unique, required |
| password_hash | VARCHAR | bcrypt, 12 rounds |
| role | ENUM | `ADMIN`, `STAFF` |
| is_active | BOOLEAN | Default: `true`; deactivated users cannot log in |
| failed_login_attempts | INT | Default: `0`; reset on successful login |
| locked_until | TIMESTAMP | Null unless account is temporarily locked |
| last_login_at | TIMESTAMP | Updated on each successful login |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `enquiries`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | VARCHAR | Required |
| phone | VARCHAR | Required |
| email | VARCHAR | Optional |
| course | VARCHAR | |
| enquiry_date | DATE | |
| lead_status | ENUM | `NOT_INTERESTED`, `FOLLOW_UP`, `JOINED` |
| last_followup_date | DATE | |
| notes | TEXT | |
| converted_student_id | UUID | FK → students (nullable) |
| created_at | TIMESTAMP | |

---

### `students`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| student_code | VARCHAR | Auto-generated, e.g. `RRR-0001` |
| name | VARCHAR | Required |
| phone | VARCHAR | Unique, required |
| email | VARCHAR | Optional |
| dob | DATE | |
| address | TEXT | |
| photo_url | VARCHAR | S3 / local path |
| govt_id_type | ENUM | `AADHAAR`, `PAN`, `DL`, `PASSPORT` |
| govt_id_number | VARCHAR | |
| govt_id_url | VARCHAR | Document upload path |
| course | VARCHAR | |
| fingerprint_id | VARCHAR | Optional unique identifier |
| status | ENUM | `ACTIVE`, `EXPIRED`, `PAUSED`, `LEFT` |
| enquiry_id | UUID | FK → enquiries (nullable) |
| created_at | TIMESTAMP | |

---

### `memberships`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| student_id | UUID | FK → students |
| start_date | DATE | |
| end_date | DATE | |
| cabin_id | UUID | FK → cabins (nullable) |
| locker_id | UUID | FK → lockers (nullable) |
| payment_status | ENUM | `PAID`, `PARTIAL`, `PENDING` |
| amount_due | DECIMAL(10,2) | Auto-filled from cabin monthly price on creation |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `cabins`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| cabin_no | VARCHAR | Unique |
| room_name | VARCHAR | e.g. General, NON AC Premium, Elite, Pvt-1 |
| category | VARCHAR | `RRR 1.0` or `RRR 2.0` |
| cabin_type | ENUM | `STANDARD`, `PREMIUM`, `AC` |
| monthly_price | DECIMAL(10,2) | Monthly rental price (nullable) |
| status | ENUM | `VACANT`, `OCCUPIED`, `EXPIRING_SOON`, `INACTIVE` |
| current_membership_id | UUID | FK → memberships (nullable) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `lockers`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| locker_no | VARCHAR | Unique |
| area | VARCHAR | `General Locker` or `Elite Locker` |
| status | ENUM | `VACANT`, `OCCUPIED` |
| current_student_id | UUID | FK → students (nullable) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `payments`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| membership_id | UUID | FK → memberships |
| student_id | UUID | FK → students |
| amount | DECIMAL(10,2) | |
| paid_at | TIMESTAMP | |
| payment_mode | ENUM | `CASH`, `UPI`, `CARD`, `BANK_TRANSFER`, `CHEQUE` |
| txn_reference | VARCHAR | Optional |
| invoice_number | VARCHAR | Auto-generated |
| invoice_url | VARCHAR | PDF path |
| notes | TEXT | |
| created_at | TIMESTAMP | |

---

## 6. API Endpoints (Summary)

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with email + password; sets `httpOnly` JWT cookie |
| POST | `/api/auth/logout` | Clears JWT cookie |
| GET | `/api/auth/me` | Returns current logged-in user profile |
| PUT | `/api/auth/change-password` | Change own password (requires current password) |
| GET | `/api/users` | List all users — Admin only |
| POST | `/api/users` | Create new staff/admin user — Admin only |
| PUT | `/api/users/:id` | Update user (name, email, role, active status) — Admin only |
| PUT | `/api/users/:id/reset-password` | Admin resets a user's password — Admin only |

### Enquiries
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/enquiries` | List all enquiries |
| POST | `/api/enquiries` | Create new enquiry |
| PUT | `/api/enquiries/:id` | Update enquiry / status |
| DELETE | `/api/enquiries/:id` | Delete enquiry |
| POST | `/api/enquiries/:id/convert` | Convert to student |

### Students
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students` | List students (search, status filter, pagination) |
| POST | `/api/students` | Register new student |
| GET | `/api/students/:id` | Get student detail with memberships |
| PUT | `/api/students/:id` | Update student |
| GET | `/api/students/:id/memberships` | Get student's membership history |
| POST | `/api/students/:id/memberships` | Create membership (auto-fills amountDue, releases prior cabin/locker) |

### Cabins
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cabins` | List all cabins with active membership + dynamic status |
| POST | `/api/cabins` | Add new cabin (admin) |
| PUT | `/api/cabins/:id` | Update cabin fields including monthlyPrice (admin) |
| POST | `/api/cabins/:id/release` | Release cabin — expires active membership, sets VACANT |

### Lockers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/lockers` | List all lockers with current student |
| POST | `/api/lockers` | Add new locker (admin) |
| POST | `/api/lockers/:id/release` | Release locker — clears membership lockerId and currentStudentId |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/payments` | List payments (filter by studentId, membershipId; paginated) |
| POST | `/api/payments` | Record a payment (auto-generates invoice number, sets membership PAID) |
| GET | `/api/payments/:id` | Get payment detail |
| GET | `/api/payments/summary` | Revenue summary by mode + recent payments |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/dashboard` | Full dashboard data — KPIs, monthly trend, breakdowns, expiring memberships |

---

## 7. UI Pages / Routes

| Route | Page |
|---|---|
| `/login` | Login page |
| `/` | Dashboard / Home |
| `/enquiries` | Enquiry board (Kanban + List) |
| `/enquiries/new` | New enquiry form |
| `/students` | Student list |
| `/students/new` | New student registration form |
| `/students/:id` | Student detail / edit |
| `/cabins` | Cabin & locker grid |
| `/payments` | Payment list + Record Payment modal |
| `/reports` | Accounting & reports dashboard |
| `/settings` | App settings (cabin count, expiry alert days, etc.) |
| `/settings/users` | User management — Admin only (create, edit, deactivate staff/admin accounts) |

---

## 8. Non-Functional Requirements

- **Responsive**: Works on desktop and tablet browsers.
- **File uploads**: Profile photos and ID documents stored securely (local `uploads/` folder initially, S3-ready).
- **PDF generation**: Invoices and reports generated server-side using `pdfkit`.
- **Data validation**: All forms validated on both client (React Hook Form + Zod) and server (Zod).
- **Audit trail**: `created_at` / `updated_at` timestamps on all tables.
- **Search & pagination**: All list views support search and pagination.

---

## 9. Implementation Phases

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | Project scaffold, DB schema, Prisma migrations, Auth | ✅ Done |
| **Phase 2** | Enquiry module (form, Kanban board, status management) | ✅ Done |
| **Phase 3** | Student registration — expanded fields from admission CSV | ✅ Done |
| **Phase 4** | Cabin & locker visual grid + assignment + release/reassign | ✅ Done |
| **Phase 5** | Membership management — amountDue auto-fill, release bug fix | ✅ Done |
| **Phase 6** | Payments — record, list, invoice number, pre-fill from cabin price | ✅ Done |
| **Phase 7** | Reports dashboard — KPIs, monthly trend, breakdowns, expiring list | ✅ Done |
| **Phase 8** | Cabin pricing system — monthlyPrice per room/category, UI integration | ✅ Done |
| **Phase 9** | Seed data — 50 students + 47 cabin assignments from seating sheet | ✅ Done |
| **Phase 10** | PDF invoices, CSV exports, WhatsApp/Email notifications | 🔜 Planned |
| **Phase 11** | Settings page — expiry alert days, cabin pricing management UI | 🔜 Planned |

---

## 10. Project Directory Structure

```
Readingroom/
├── apps/
│   ├── api/                        # Node.js + Express backend
│   │   ├── src/
│   │   │   ├── routes/             # Express route handlers
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── enquiries.ts
│   │   │   │   ├── students.ts
│   │   │   │   ├── cabins.ts
│   │   │   │   ├── lockers.ts
│   │   │   │   ├── payments.ts
│   │   │   │   └── reports.ts
│   │   │   ├── middleware/         # Auth, error handling
│   │   │   └── lib/                # Prisma client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   ├── seed.ts             # Cabins + lockers seed
│   │   │   └── seed-students.ts    # Student data from seating sheet
│   │   └── package.json
│   └── web/                        # React + Vite frontend
│       ├── src/
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── EnquiriesPage.tsx
│       │   │   ├── EnquiryFormPage.tsx
│       │   │   ├── StudentsPage.tsx
│       │   │   ├── StudentFormPage.tsx
│       │   │   ├── StudentDetailPage.tsx
│       │   │   ├── CabinsPage.tsx
│       │   │   ├── PaymentsPage.tsx
│       │   │   └── ReportsPage.tsx
│       │   ├── components/         # Reusable UI components (shadcn/ui)
│       │   ├── contexts/           # AuthContext
│       │   ├── lib/                # api.ts, utils.ts
│       │   └── types/              # index.ts — shared TypeScript interfaces
│       └── package.json
├── software-spec.md
└── README.md
```
