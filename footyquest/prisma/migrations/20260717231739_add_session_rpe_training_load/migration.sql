-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "planId" TEXT,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "plannedLoad" INTEGER NOT NULL DEFAULT 0,
    "actualLoad" INTEGER NOT NULL DEFAULT 0,
    "rpe" INTEGER,
    "trainingLoad" INTEGER NOT NULL DEFAULT 0,
    "effort" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "assignedById" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Session_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Session_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("actualLoad", "assignedById", "childId", "completedAt", "createdAt", "date", "effort", "focus", "id", "notes", "planId", "plannedLoad", "status", "title") SELECT "actualLoad", "assignedById", "childId", "completedAt", "createdAt", "date", "effort", "focus", "id", "notes", "planId", "plannedLoad", "status", "title" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE INDEX "Session_childId_date_idx" ON "Session"("childId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
