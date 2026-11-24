-- AlterTable
ALTER TABLE "Habit" ADD COLUMN "weeklyTarget" INTEGER;

-- Example from the request: No tea/coffee is a 3 days a week habit
UPDATE "Habit" SET "weeklyTarget" = 3 WHERE "name" = 'No tea/coffee';
