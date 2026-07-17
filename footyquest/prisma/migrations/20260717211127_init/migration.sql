-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ChildProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '⚽',
    "goal" TEXT NOT NULL DEFAULT 'HAVE_FUN',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "streakFreezes" INTEGER NOT NULL DEFAULT 1,
    "lastActiveDay" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChildProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InviteCode" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "usedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InviteCode_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoachLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coachId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoachLink_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoachLink_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "benchmarks" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ChildSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "progressionLevel" REAL NOT NULL DEFAULT 1.0,
    "tier" TEXT NOT NULL DEFAULT 'NONE',
    "bestResult" REAL,
    CONSTRAINT "ChildSkill_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChildSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillResult_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkillResult_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Drill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" REAL NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "loadScore" INTEGER NOT NULL,
    "equipment" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "coachingPoints" TEXT NOT NULL,
    "targetMetric" TEXT,
    "videoUrl" TEXT,
    CONSTRAINT "Drill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "weeks" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingPlan_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "planId" TEXT,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "plannedLoad" INTEGER NOT NULL DEFAULT 0,
    "actualLoad" INTEGER NOT NULL DEFAULT 0,
    "effort" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "assignedById" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Session_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Session_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionDrill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "resultValue" REAL,
    CONSTRAINT "SessionDrill_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionDrill_drillId_fkey" FOREIGN KEY ("drillId") REFERENCES "Drill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ChildBadge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "childId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChildBadge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "ChildProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChildBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ChildProfile_username_key" ON "ChildProfile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "CoachLink_coachId_childId_key" ON "CoachLink"("coachId", "childId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildSkill_childId_skillId_key" ON "ChildSkill"("childId", "skillId");

-- CreateIndex
CREATE INDEX "Session_childId_date_idx" ON "Session"("childId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChildBadge_childId_badgeId_key" ON "ChildBadge"("childId", "badgeId");
