# AGENTS.md - Project Context for Codex

## Project Overview
ProductivityApp is a local-first personal productivity suite: a monorepo with a React
frontend and an Express backend, using SQLite (Prisma ORM) for persistence. Single user,
no authentication.

## Commands
- `npm run dev` (root) — starts both backend and frontend concurrently
- `cd backend && npm run dev` — Express server on port 4000
- `cd frontend && npm run dev` — Vite dev server on port 5173
- `cd backend && npx prisma migrate dev` — run database migrations
- `cd backend && npx prisma db seed` — seed default categories, accounts, and task list
- `cd backend && npx prisma generate` — regenerate the Prisma client after schema edits
- `cd backend && npx tsc --noEmit` — type-check backend
- `cd frontend && npx tsc --noEmit` — type-check frontend

There are no tests, no ESLint/Prettier config, and no git repository in this project.
Type-checking both packages is the only automated verification available.

## Database location
`DATABASE_URL` in `backend/.env` points at a OneDrive-synced path
(`C:/Users/<user>/OneDrive/productivity-app-data/dev.db`), not at `backend/prisma/dev.db`.
That is deliberate — OneDrive sync is how data moves between machines. `backend/prisma/dev.db`
is an abandoned leftover from before the move; do not use it.

Migration history was baselined on 2026-03-06 (`20260306120000_baseline`) after a long
period of schema changes applied with `db push`. That single migration reflects the whole
current schema. Going forward, change the schema with `prisma migrate dev` so history and
database stay in sync — and back up the OneDrive `dev.db` before any migration that drops
or rewrites a table.

## Architecture

### Backend (`backend/`)
- Pattern: `routes → controller → service → prisma` (no repository layer)
- Entry point: `backend/src/server.ts`
- Shared utilities: `backend/src/shared/` (db, middleware, types, utils)
- Modules: `backend/src/modules/<module-name>/`
- Database: SQLite (see above), schema at `backend/prisma/schema.prisma`
- Validation: Zod schemas in `*.types.ts` files
- All routes use `asyncHandler`; `errorHandler` maps `ZodError` → 400, everything else → 500
- File uploads use `multer` with memory storage and a 10MB cap

### Frontend (`frontend/`)
- Pattern: RTK Query for data fetching, modular feature folders
- Entry point: `frontend/src/main.tsx`
- State: Redux store at `frontend/src/store/index.ts`, one RTK Query API slice per module
- Shared components: `frontend/src/shared/components/` (AppLayout, PageHeader, ConfirmDialog,
  LoadingSpinner, EmptyState, IconPicker)
- Modules: `frontend/src/modules/<module-name>/` with `types/`, `store/`, `hooks/`,
  `components/`, `pages/`
- Vite proxies `/api` to `localhost:4000`

## Implemented Modules

### Finance Tracker (`/expenses`)
Expenses **and** income, across multiple accounts, with budgets. Despite the `expenses`
folder and route names, the core model is `Transaction` with a `type` of `EXPENSE` or `INCOME`.
- Backend: `backend/src/modules/expenses/` (transaction.*, category.*, account.*, budget.*,
  importExport.*)
- Frontend: `frontend/src/modules/expenses/` — 4 pages: Dashboard, Calendar, Analytics, Budgets
- DB models: `Transaction`, `Category`, `Account`, `Budget`
- Summaries (daily/monthly/yearly/category) are aggregated server-side, not in the browser
- Most endpoints accept an `accountIds` query param — comma-separated, e.g. `1,2,3`

### To-Do (`/todos`)
Microsoft To-Do style: `TaskList → Task → SubTask`, plus smart views (My Day, Important,
Planned, All) resolved server-side in `task.service.ts`.
- Backend: `backend/src/modules/todos/` (task.*, taskList.*, todoImportExport.*)
- Frontend: `frontend/src/modules/todos/` — single page with its own three-pane layout
- DB models: `TaskList`, `Task`, `SubTask`
- This module renders its own sidebar; `AppLayout` hides the global drawer on `/todos`
- `todoUiSlice` holds the selected view/list/task (the only non-RTK-Query client state)

### Worklog (`/worklog`)
Editable Excel-like grid with per-row priority and color coding.
- Backend: `backend/src/modules/worklog/` (worklog.*, worklogImportExport.*)
- Frontend: `frontend/src/modules/worklog/`
- DB model: `WorklogEntry`

**Task → Worklog automation:** completing a task or subtask auto-creates a `WorklogEntry`
(`task.service.ts`, in `updateTask` and `updateSubTask`). Duplicates are prevented by looking
up an existing entry with the same `sourceType` + `sourceId` before inserting, so re-completing
a reopened task does not add a second row. Subtask completions carry the parent task title
into `projectWork`. If you touch task completion, preserve that guard.

### Import / Export
All three modules support import and export via `multer` + `xlsx`. The To-Do importer also
parses **PDF exports of Microsoft To-Do's print view** (`todoImportExport.service.ts`) by
decoding its glyph markers — `K` = active task, `O` = completed, `þ`/`ÿ` = subtasks,
`Խ` = important. It is tightly coupled to that exact PDF layout and is brittle by nature;
`To Do task list.pdf` at the repo root is the reference file it was built against.

## Not Implemented
- **Daily Streak Tracker** — no schema, no backend, no frontend. It appears in the nav as a
  disabled "Coming Soon" entry in `AppLayout.tsx`. This is the only module from the original
  spec (`docs/Codex-architecture-prompt.md`) that remains unbuilt.

## API Routes (mounted in `backend/src/server.ts`)
| Base path | Module |
|-----------|--------|
| `/api/v1/transactions` | Transactions + `/summary/{daily,monthly,yearly,category}` |
| `/api/v1/categories` | Categories (CRUD) |
| `/api/v1/accounts` | Accounts (CRUD) |
| `/api/v1/budgets` | Budgets (CRUD) + `/summary` with spent/remaining |
| `/api/v1/data` | Finance import/export |
| `/api/v1/lists` | Task lists (CRUD) |
| `/api/v1/tasks` | Tasks + `/stats` + `/:taskId/subtasks` |
| `/api/v1/tasks/data` | To-Do import/export (mounted before `/tasks`) |
| `/api/v1/worklog` | Worklog entries (CRUD) |
| `/api/v1/worklog/data` | Worklog import/export (mounted before `/worklog`) |
| `/api/health` | Health check |

Note the ordering constraint: `/tasks/data` and `/worklog/data` must stay mounted **before**
`/tasks` and `/worklog`, or the `/:id` routes will swallow them.

## Conventions
- Backend API responses use shape: `{ success: boolean, data?: T, error?: string }`
- Frontend RTK Query slices use `transformResponse` to unwrap the `data` field
- Cache invalidation via RTK Query tags — finance: `['Transaction', 'Category', 'Summary',
  'Account', 'Budget']`; todos: `['Task', 'TaskList', 'TaskStats']`; worklog: `['Worklog']`
- Partial updates: services build an `updateData` object with `if (x !== undefined)` guards
  rather than passing the payload straight through
- MUI for all UI components, Inter font family
- Day.js for date operations; Recharts for charts; Zod for validation on both sides

## Adding a New Module
1. Add Prisma models to `backend/prisma/schema.prisma`, run `prisma migrate dev`
2. Create backend module: `backend/src/modules/<name>/` with types, service, controller, routes
3. Mount routes in `backend/src/server.ts`
4. Create frontend module: `frontend/src/modules/<name>/` with types, store (RTK Query),
   hooks, components, pages
5. Register RTK Query slice (reducer *and* middleware) in `frontend/src/store/index.ts`
6. Add routes in `frontend/src/App.tsx`
7. Add nav items in `frontend/src/shared/components/AppLayout.tsx` (flip `ready: true`)
