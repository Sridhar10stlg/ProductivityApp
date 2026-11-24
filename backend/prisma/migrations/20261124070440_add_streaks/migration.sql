-- CreateTable
CREATE TABLE "HabitSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "startDate" TEXT NOT NULL,
    "productiveThreshold" REAL NOT NULL DEFAULT 0.78,
    "planCThreshold" REAL NOT NULL DEFAULT 0.63,
    "weeklyGoal" INTEGER NOT NULL DEFAULT 5,
    "gateEasy" INTEGER NOT NULL DEFAULT 30,
    "gateTotal" INTEGER NOT NULL DEFAULT 80,
    "gateMedium" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HabitPhase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phase" INTEGER NOT NULL,
    "startsInWeek" INTEGER NOT NULL,
    "brainNeeded" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "activeFromPhase" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HabitDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'A',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HabitEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayId" INTEGER NOT NULL,
    "habitId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "HabitEntry_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "HabitDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HabitEntry_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeetCodeEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "link" TEXT,
    "pattern" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'EASY',
    "minutes" INTEGER,
    "solvedSolo" BOOLEAN NOT NULL DEFAULT true,
    "redoDone" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "HabitPhase_phase_key" ON "HabitPhase"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "Habit_name_key" ON "Habit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HabitDay_date_key" ON "HabitDay"("date");

-- CreateIndex
CREATE INDEX "HabitEntry_habitId_idx" ON "HabitEntry"("habitId");

-- CreateIndex
CREATE UNIQUE INDEX "HabitEntry_dayId_habitId_key" ON "HabitEntry"("dayId", "habitId");

-- CreateIndex
CREATE INDEX "LeetCodeEntry_date_idx" ON "LeetCodeEntry"("date");
