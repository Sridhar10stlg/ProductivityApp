-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HabitSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "startDate" TEXT NOT NULL,
    "productiveThreshold" REAL NOT NULL DEFAULT 0.5,
    "planCThreshold" REAL NOT NULL DEFAULT 0.63,
    "weeklyGoal" INTEGER NOT NULL DEFAULT 5,
    "bodyNeeded" INTEGER NOT NULL DEFAULT 2,
    "brainNeeded" INTEGER NOT NULL DEFAULT 1,
    "gateEasy" INTEGER NOT NULL DEFAULT 30,
    "gateTotal" INTEGER NOT NULL DEFAULT 80,
    "gateMedium" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_HabitSettings" ("createdAt", "gateEasy", "gateMedium", "gateTotal", "id", "planCThreshold", "productiveThreshold", "startDate", "updatedAt", "weeklyGoal") SELECT "createdAt", "gateEasy", "gateMedium", "gateTotal", "id", "planCThreshold", "productiveThreshold", "startDate", "updatedAt", "weeklyGoal" FROM "HabitSettings";
DROP TABLE "HabitSettings";
ALTER TABLE "new_HabitSettings" RENAME TO "HabitSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Productive day = half of the Anchor habits, 2 Body and 1 Brain
UPDATE "HabitSettings" SET "productiveThreshold" = 0.5, "bodyNeeded" = 2, "brainNeeded" = 1 WHERE "id" = 1;
