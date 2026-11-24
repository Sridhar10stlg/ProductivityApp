-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Habit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "activeFromPhase" INTEGER NOT NULL DEFAULT 1,
    "startDate" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "weekdays" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Habit" ("activeFromPhase", "archived", "createdAt", "group", "id", "name", "sortOrder", "startDate", "updatedAt") SELECT "activeFromPhase", "archived", "createdAt", "group", "id", "name", "sortOrder", "startDate", "updatedAt" FROM "Habit";
DROP TABLE "Habit";
ALTER TABLE "new_Habit" RENAME TO "Habit";
CREATE UNIQUE INDEX "Habit_name_key" ON "Habit"("name");

-- Starting points for existing habits (1 = essential ... 5 = core); Office is a weekday habit
UPDATE "Habit" SET "points" = 5 WHERE "name" = 'Office';
UPDATE "Habit" SET "points" = 5 WHERE "name" = 'System design';
UPDATE "Habit" SET "points" = 4 WHERE "name" = 'German';
UPDATE "Habit" SET "points" = 3 WHERE "name" = 'Walking';
UPDATE "Habit" SET "points" = 4 WHERE "name" = 'Jogging';
UPDATE "Habit" SET "points" = 4 WHERE "name" = 'Workout 20 min';
UPDATE "Habit" SET "points" = 4 WHERE "name" = 'LeetCode (no AI)';
UPDATE "Habit" SET "points" = 4 WHERE "name" = 'DSA';
UPDATE "Habit" SET "points" = 4 WHERE "name" = 'Courses';
UPDATE "Habit" SET "points" = 3 WHERE "name" = 'Wake before 8';
UPDATE "Habit" SET "points" = 3 WHERE "name" = 'Not home before 6';
UPDATE "Habit" SET "points" = 3 WHERE "name" = 'Screen < 3 h';
UPDATE "Habit" SET "points" = 3 WHERE "name" = 'Stock/venture';
UPDATE "Habit" SET "points" = 2 WHERE "name" = 'Plan the day';
UPDATE "Habit" SET "points" = 2 WHERE "name" = 'No tea/coffee';
UPDATE "Habit" SET "points" = 2 WHERE "name" = 'Stretching';
UPDATE "Habit" SET "points" = 1 WHERE "name" = 'Breakfast';
UPDATE "Habit" SET "points" = 1 WHERE "name" = 'Lunch';
UPDATE "Habit" SET "points" = 1 WHERE "name" = 'Dinner';
UPDATE "Habit" SET "points" = 1 WHERE "name" = 'Pushups x10';
UPDATE "Habit" SET "weekdays" = '1,2,3,4,5' WHERE "name" = 'Office';

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
