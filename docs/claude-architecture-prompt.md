You are a senior full-stack architect and clean-code evangelist.

Your task is to DESIGN and BOOTSTRAP a multi-purpose productivity tracking web application with a strong, extensible architecture following:
- SOLID principles
- Clean Architecture
- Separation of Concerns
- Scalable folder structure
- Beginner-friendly but production-grade boilerplate

⚙️ TECH STACK (STRICT)
- Frontend: React + TypeScript
- UI: Material UI (MUI)
- State Management: Redux Toolkit (or Zustand if justified)
- Routing: React Router
- Backend: Node.js + TypeScript
- API: REST (well-versioned)
- ORM: Prisma
- Database: SQLite (local-first, free, portable, persistent)
- Auth: Optional stub (future-ready)
- Validation: Zod
- Dates & Calendar: Day.js
- Charts: Recharts
- Tooling: ESLint, Prettier, Husky-ready

--------------------------------------------------
🎯 PRODUCT GOAL
Build ONE unified productivity web app that contains the following modules:

1️⃣ Expense Tracker (Calendar-Based)
- Daily expense entries
- Monthly & yearly summaries
- Category-based tracking
- Calendar view inspired by "Smart Budget"
- Charts & analytics
- CRUD support

2️⃣ Daily Streak Tracker
- Habit-based streaks
- Visual streak chains (like Streaks app)
- Missed-day logic
- Motivation indicators
- Streak history stored permanently

3️⃣ To-Do / Task Management (Microsoft To-Do style)
- Lists → Tasks → Sub-tasks
- Left Pane including My Day, Important, Planner, All Tasks, Personal 
- Due dates, reminders, priority
- Completion tracking
- Clean, minimal UI

4️⃣ Task-to-Worklog (Excel-like View)
Once a task or sub-task is completed:
- Automatically move it to a Worklog table with priority level
- Display as an editable Excel-like grid
- Persist data in DB

Worklog Columns:
- Date
- Nature of Work
- Account
- Project
- Important Tasks / Features
- Tools / Technology / Skills
- Remarks
- Attachments (file metadata only)

--------------------------------------------------
🧱 ARCHITECTURE REQUIREMENTS

✔ Use Clean Architecture layers:
- Domain (entities, interfaces, business rules)
- Application (use-cases)
- Infrastructure (DB, APIs)
- Presentation (UI)

✔ Each feature must be modular:
- expenses/
- streaks/
- todos/
- worklog/

✔ Each module must contain:
- components/
- pages/
- hooks/
- services/
- store/
- types/

✔ Backend must expose versioned APIs:
- /api/v1/expenses
- /api/v1/streaks
- /api/v1/todos
- /api/v1/worklogs

✔ Frontend must NEVER talk directly to DB

--------------------------------------------------
📂 DELIVERABLES

1. Project folder structure (frontend + backend)
2. Database schema (Prisma)
3. API contracts (request/response examples)
4. Redux/Zustand store layout
5. Reusable UI components
6. Sample calendar view
7. Editable table implementation approach
8. Clear README explaining:
   - How to run locally
   - How data persists across machines
   - How to extend new modules later

--------------------------------------------------
🧩 IMPORTANT CONSTRAINTS

- App must work fully on localhost
- Data must persist even after:
  - Laptop switch
  - Fresh git clone
- SQLite DB must be portable
- No paid services
- Avoid overengineering
- Code must be readable by mid-level developers

--------------------------------------------------
🧪 BONUS (OPTIONAL)
- Dark mode support
- Export worklog to CSV
- Simple backup/restore strategy
- Offline-first mindset

--------------------------------------------------
🚀 OUTPUT FORMAT

Step 1: High-level architecture explanation  
Step 2: Folder structure (tree view)  
Step 3: Prisma schema  
Step 4: API design  
Step 5: Frontend state & component strategy  
Step 6: Sample code snippets (minimal but real)  
Step 7: README.md  

DO NOT generate filler text.
DO NOT skip reasoning.
Think like you are building a real product.
