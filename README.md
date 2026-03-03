# NurseTrack — Nursing/MedTech Inventory System

A web-based equipment borrowing and inventory management system for nursing and medical technology departments. Replaces paper-based and Google Forms workflows with a structured, role-based digital system.

---

## Features

- **Public Borrow Form** — Students submit borrow requests without an account
- **Staff Dashboard** — Real-time metrics, overdue alerts, recent transactions
- **Return Processing** — Per-item condition recording and status updates
- **Inventory Management** — Equipment models and individual item tracking
- **Procedure Management** — Link procedures to required equipment
- **Reports & Export** — Generate Excel and PDF reports with date filtering
- **Admin Controls** — Manage departments, categories, staff accounts, and system settings
- **Green Color Theme** — Consistent brand identity with configurable category colors
- **Role-Based Access** — Public, Staff, and Admin permission levels

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS v3 + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Email/Password + Google OAuth |
| State | Zustand (auth) + TanStack Query (server state) |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Export | xlsx (Excel) + jspdf-autotable (PDF) |

---

## Project Structure

```
src/
├── components/
│   ├── layout/        # AppShell, Sidebar, PublicLayout
│   └── ui/            # shadcn/ui components
├── hooks/             # useAuth, useToast
├── lib/               # supabase client, export helpers, utils
├── pages/             # One file per route/module
├── router/            # React Router config + role guards
├── stores/            # Zustand auth store
└── types/             # TypeScript types for all DB entities

supabase/
└── migrations/
    └── 001_schema.sql # Full DB schema, RLS policies, seed data
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Apply the database schema

Open your Supabase project → **SQL Editor** → paste and run the contents of:

```
supabase/migrations/001_schema.sql
```

This creates all tables, enums, RLS policies, triggers, and seed data (departments, categories, procedures).

### 4. Enable Google OAuth (optional)

In the Supabase dashboard: **Authentication → Providers → Google** — enable and add your OAuth credentials. Set the redirect URL to your app's origin + `/dashboard`.

### 5. Set the first admin user

After signing up, manually update your profile role in the Supabase Table Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 6. Start the dev server

```bash
npm run dev
```

---

## Routes

| Path | Access | Description |
|---|---|---|
| `/` | Public | Redirects to `/borrow` |
| `/borrow` | Public | Student equipment borrow form |
| `/login` | Public | Staff/Admin login |
| `/dashboard` | Staff | Metrics, charts, overdue list |
| `/returns` | Staff | Process equipment returns |
| `/transactions` | Staff | All transaction history |
| `/borrowers` | Staff | Borrower profiles |
| `/inventory` | Admin | Equipment models and items |
| `/procedures` | Admin | Procedure and equipment mapping |
| `/categories` | Admin | Category management with colors |
| `/departments` | Admin | Department management |
| `/staff` | Admin | Staff account management |
| `/reports` | Admin | Report generation and export |
| `/settings` | Admin | System config and compartments |

---

## Database Schema

Key tables:

- `profiles` — Staff/admin accounts (linked to Supabase Auth)
- `borrowers` — Student profiles (auto-created on borrow form submit)
- `equipment_models` — Equipment types with category and compartment
- `equipment_items` — Individual physical items with status tracking
- `borrow_transactions` — Borrow records linked to borrower + procedure
- `borrow_items` — Per-item records within a transaction
- `procedures` — Medical/nursing procedures
- `procedure_equipment` — Many-to-many: procedures ↔ equipment models
- `departments`, `categories`, `compartments` — Reference/config tables
- `system_config` — Runtime-configurable settings (no code changes needed)

---

## Build

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host. Set the same environment variables in your hosting provider's dashboard.

---

## User Roles

| Role | Capabilities |
|---|---|
| **Public** | Submit borrow requests (no login) |
| **Staff** | Process returns, view transactions and borrowers, access dashboard |
| **Admin** | Everything Staff can do + full inventory, config, reports, and staff management |
