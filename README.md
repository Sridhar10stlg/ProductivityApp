# ProductivityApp

A local-first personal productivity suite built with React, Express, and SQLite.
Single user, no authentication, runs entirely on localhost.

## Modules

- **Finance Tracker** — expense *and* income tracking across multiple accounts, with
  calendar view, budgets, charts, and analytics
- **To-Do / Task Management** — Microsoft To-Do style lists, tasks, and sub-tasks with
  My Day / Important / Planned smart views
- **Task-to-Worklog** — completed tasks flow automatically into an editable, Excel-like
  worklog grid
- **Daily Streak Tracker** — *(not implemented)*

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript, Material UI, Redux Toolkit (RTK Query), React Router |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite via Prisma ORM |
| Validation | Zod |
| Charts | Recharts |
| Dates | Day.js |
| Files | multer (upload), xlsx (Excel), pdf-parse (PDF import) |

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Or install individually
cd backend && npm install
cd ../frontend && npm install
cd ..
npm install
```

### Database Setup

Create `backend/.env` and point `DATABASE_URL` at wherever you want the SQLite file to live:

```
DATABASE_URL="file:C:/Users/<you>/OneDrive/productivity-app-data/dev.db"
PORT=4000
```

Then:

```bash
cd backend
npx prisma migrate dev   # creates the database and all tables
npx prisma db seed       # default categories, a "Cash" account, a "Personal" task list
```

### Running the App

```bash
# Start both backend and frontend concurrently
npm run dev

# Or start individually
cd backend && npm run dev    # Express server on http://localhost:4000
cd frontend && npm run dev   # Vite dev server on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## Data Persistence

`.env` is gitignored, so each machine chooses its own database location. Pointing
`DATABASE_URL` at a **cloud-synced folder** (OneDrive, Dropbox, etc.) is the simplest way to
keep one database across several machines — that is how this project is currently set up:

```
DATABASE_URL="file:C:/Users/<you>/OneDrive/productivity-app-data/dev.db"
```

Because it is a single SQLite file, backup and restore are just a file copy. Only run the app
on one machine at a time — SQLite over a syncing folder does not handle concurrent writers,
and two machines writing at once will produce sync conflicts.

To move to a machine that has never run the app: clone, install, create `.env`, run
`npx prisma migrate dev` (a no-op if the synced database already exists and is current),
then `npm run dev`.

### Schema changes

Migration history was baselined on 2026-03-06 as `20260306120000_baseline`, which contains the
complete current schema. It replaced an obsolete `init` migration left over from when the
finance models were still named `Expense` / `ExpenseCategory`.

Make schema changes with `npx prisma migrate dev` rather than `prisma db push`, so the
migration history stays a true record of the database. Back up `dev.db` before any migration
that drops or rewrites a table.

## Project Structure

```
ProductivityApp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── seed.ts              # Seed data
│   │   └── migrations/          # Migration history (baselined 2026-03-06)
│   └── src/
│       ├── server.ts            # Express entry point, route mounting
│       ├── shared/
│       │   ├── db/prisma.ts     # Prisma client singleton
│       │   ├── middleware/      # asyncHandler, errorHandler
│       │   ├── types/           # Shared API response types
│       │   └── utils/           # Date utilities
│       └── modules/
│           ├── expenses/        # transaction.*, category.*, account.*, budget.*,
│           │                    # importExport.*
│           ├── todos/           # task.*, taskList.*, todoImportExport.*
│           └── worklog/         # worklog.*, worklogImportExport.*
├── frontend/
│   └── src/
│       ├── main.tsx             # React entry point
│       ├── App.tsx              # Routes + layout
│       ├── theme.ts             # MUI theme
│       ├── pages/HomePage.tsx   # Module launcher
│       ├── store/               # Redux store + typed hooks
│       ├── shared/components/   # AppLayout, PageHeader, ConfirmDialog, IconPicker, etc.
│       └── modules/
│           ├── expenses/        # Dashboard, Calendar, Analytics, Budgets
│           ├── todos/           # Three-pane task UI
│           └── worklog/         # Editable grid
└── docs/
    └── claude-architecture-prompt.md   # Original design brief
```

## Architecture

### Backend Pattern

```
routes → controller → service → prisma
```

- **Routes** define Express endpoints and wire to controllers
- **Controllers** handle request validation (Zod) and response formatting
- **Services** contain business logic and Prisma queries
- **Prisma** is the ORM layer (no separate repository)

All handlers are wrapped in `asyncHandler`, so thrown errors reach a single `errorHandler`
that returns 400 for `ZodError` and 500 otherwise. Every response uses the shape
`{ success, data?, error? }`.

### Frontend Pattern

- **RTK Query** for all data fetching, with tag-based cache invalidation
- **Modular structure** per feature under `src/modules/`
- **Vite proxy** forwards `/api` requests to the backend

## API Endpoints

All endpoints are versioned under `/api/v1`.

### Transactions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/transactions` | List (filters: `year`, `month`, `type`, `categoryId`, `accountId`, `accountIds`, `startDate`, `endDate`) |
| POST | `/transactions` | Create |
| GET | `/transactions/:id` | Get one |
| PUT | `/transactions/:id` | Update |
| DELETE | `/transactions/:id` | Delete |
| GET | `/transactions/summary/daily` | Daily totals for the calendar view |
| GET | `/transactions/summary/monthly` | Monthly totals + category breakdown |
| GET | `/transactions/summary/yearly` | Month-by-month totals |
| GET | `/transactions/summary/category` | Category breakdown with percentages |

`accountIds` accepts a comma-separated list, e.g. `?accountIds=1,2,3`.

### Categories, Accounts, Budgets

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/categories` | List / create (`type` is `EXPENSE` or `INCOME`) |
| PUT/DELETE | `/categories/:id` | Update / delete |
| GET/POST | `/accounts` | List / create |
| PUT/DELETE | `/accounts/:id` | Update / delete |
| GET/POST | `/budgets` | List / create (`period`: `WEEKLY`, `MONTHLY`, `YEARLY`) |
| PUT/DELETE | `/budgets/:id` | Update / delete |
| GET | `/budgets/summary` | Each budget with spent, remaining, and percentage used |

### Tasks & Lists

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/lists` | List / create task lists |
| PUT/DELETE | `/lists/:id` | Update / delete (deleting cascades to its tasks) |
| GET | `/tasks` | List (filters: `view` = `myday`/`important`/`planned`/`all`, `listId`, `completed`) |
| POST | `/tasks` | Create |
| GET/PUT/DELETE | `/tasks/:id` | Get / update / delete |
| GET | `/tasks/stats` | Open-task counts per smart view and per list |
| POST | `/tasks/:taskId/subtasks` | Add a sub-task |
| PUT/DELETE | `/tasks/:taskId/subtasks/:id` | Update / delete a sub-task |

### Worklog

| Method | Path | Description |
|--------|------|-------------|
| GET | `/worklog` | List (filters: `from`, `to`) |
| POST | `/worklog` | Create |
| GET/PUT/DELETE | `/worklog/:id` | Get / update / delete |

### Import / Export

| Method | Path | Formats |
|--------|------|---------|
| GET | `/data/export`, `/tasks/data/export`, `/worklog/data/export` | Excel |
| POST | `/data/import` | Excel |
| POST | `/tasks/data/import` | PDF (Microsoft To-Do print export), Excel, JSON, CSV |
| POST | `/worklog/data/import` | Excel, JSON, CSV |

Uploads are capped at 10MB and held in memory (never written to disk).

## Task-to-Worklog Automation

Completing a task or sub-task automatically creates a worklog entry:

- The task title becomes **Important Tasks / Features**; its priority carries over
- For a sub-task, the parent task's title becomes **Project / Work**
- The entry records `sourceType` (`TASK` / `SUBTASK` / `MANUAL`) and `sourceId`, and that pair
  is checked before inserting — so completing, reopening, and re-completing a task will not
  create duplicate rows

Worklog rows remain fully editable afterward, and rows can be created manually.

## Development Notes

There are no tests and no ESLint/Prettier configuration. Type-checking is the available
verification step:

```bash
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

## Adding New Modules

1. Add Prisma models to `backend/prisma/schema.prisma`, then `npx prisma migrate dev`
2. Create `backend/src/modules/<name>/` with `<name>.types.ts`, `.service.ts`,
   `.controller.ts`, `.routes.ts`
3. Mount the routes in `backend/src/server.ts`
4. Create `frontend/src/modules/<name>/` with `store/` (RTK Query slice), `types/`,
   `components/`, `pages/`
5. Register the slice's **reducer and middleware** in `frontend/src/store/index.ts`
6. Add routes in `frontend/src/App.tsx`
7. Add the nav entry in `frontend/src/shared/components/AppLayout.tsx`
