import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const today = new Date().toISOString().slice(0, 10);
const tomorrowDate = new Date(`${today}T00:00:00Z`);
tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
const tomorrow = tomorrowDate.toISOString().slice(0, 10);

async function main() {
  const passwordHash = await bcrypt.hash("secret123", 10);
  const pinHash = await bcrypt.hash("1234", 10);

  const parent = await prisma.user.upsert({
    where: { email: "sam@example.com" },
    update: { name: "Sam Parker", role: "PARENT", passwordHash },
    create: {
      name: "Sam Parker",
      email: "sam@example.com",
      role: "PARENT",
      passwordHash,
    },
  });

  const coach = await prisma.user.upsert({
    where: { email: "coach@example.com" },
    update: { name: "Alex Rivera", role: "COACH", passwordHash },
    create: {
      name: "Alex Rivera",
      email: "coach@example.com",
      role: "COACH",
      passwordHash,
    },
  });

  const jordan = await prisma.childProfile.upsert({
    where: { username: "jordan10" },
    update: {
      parentId: parent.id,
      name: "Jordan",
      pinHash,
      birthYear: new Date().getUTCFullYear() - 11,
      avatar: "🦁",
      goal: "MAKE_TEAM",
      xp: 73,
      streak: 1,
      bestStreak: 1,
      lastActiveDay: today,
    },
    create: {
      parentId: parent.id,
      name: "Jordan",
      username: "jordan10",
      pinHash,
      birthYear: new Date().getUTCFullYear() - 11,
      avatar: "🦁",
      goal: "MAKE_TEAM",
      xp: 73,
      streak: 1,
      bestStreak: 1,
      lastActiveDay: today,
    },
  });

  await prisma.coachLink.upsert({
    where: { coachId_childId: { coachId: coach.id, childId: jordan.id } },
    update: {},
    create: { coachId: coach.id, childId: jordan.id },
  });

  await prisma.childSkill.upsert({
    where: { childId_skillId: { childId: jordan.id, skillId: "juggling" } },
    update: { progressionLevel: 2.6, tier: "BRONZE", bestResult: 12 },
    create: {
      childId: jordan.id,
      skillId: "juggling",
      progressionLevel: 2.6,
      tier: "BRONZE",
      bestResult: 12,
    },
  });

  for (const badgeId of ["first-session", "bronze-first"]) {
    await prisma.childBadge.upsert({
      where: { childId_badgeId: { childId: jordan.id, badgeId } },
      update: {},
      create: { childId: jordan.id, badgeId },
    });
  }

  let completedSession = await prisma.session.findFirst({
    where: { childId: jordan.id, date: today, title: "Quick Session: Juggling" },
  });

  if (!completedSession) {
    completedSession = await prisma.session.create({
      data: {
        childId: jordan.id,
        date: today,
        title: "Quick Session: Juggling",
        focus: "juggling",
        status: "COMPLETED",
        plannedLoad: 24,
        actualLoad: 24,
        effort: "HARD",
        notes: "First session, felt good!",
        completedAt: new Date(),
        drills: {
          create: [
            { drillId: "juggle-bounce", order: 0, completed: true, resultValue: 12 },
            { drillId: "juggle-feet-only", order: 1, completed: true, resultValue: 8 },
          ],
        },
      },
    });
  }

  const existingFeedback = await prisma.feedback.findFirst({
    where: {
      sessionId: completedSession.id,
      coachId: coach.id,
      message: "Great start Jordan! Keep the ball below knee height.",
    },
  });
  if (!existingFeedback) {
    await prisma.feedback.create({
      data: {
        sessionId: completedSession.id,
        coachId: coach.id,
        message: "Great start Jordan! Keep the ball below knee height.",
      },
    });
  }

  const plannedSession = await prisma.session.findFirst({
    where: { childId: jordan.id, date: tomorrow, title: "Weak foot homework" },
  });
  if (!plannedSession) {
    await prisma.session.create({
      data: {
        childId: jordan.id,
        date: tomorrow,
        title: "Weak foot homework",
        focus: "weak-foot",
        plannedLoad: 29,
        assignedById: coach.id,
        drills: {
          create: [
            { drillId: "weak-wall-passing", order: 0 },
            { drillId: "weak-dribble-finish", order: 1 },
          ],
        },
      },
    });
  }

  console.log(`
Demo data is ready:
  Parent: sam@example.com / secret123
  Coach:  coach@example.com / secret123
  Player: jordan10 / PIN 1234

The coach is already linked to Jordan. Demo credentials are for local
development only; never seed them into a production database.
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
