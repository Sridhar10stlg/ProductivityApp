-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HabitDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'A',
    "wellSpent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_HabitDay" ("createdAt", "date", "id", "notes", "plan", "updatedAt") SELECT "createdAt", "date", "id", "notes", "plan", "updatedAt" FROM "HabitDay";
DROP TABLE "HabitDay";
ALTER TABLE "new_HabitDay" RENAME TO "HabitDay";
CREATE UNIQUE INDEX "HabitDay_date_key" ON "HabitDay"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
