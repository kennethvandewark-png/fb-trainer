import { prisma } from "./db";
import { Benchmarks, ageFromBirthYear, tierForResult, isBetterResult, TIERS } from "./benchmarks";

// ---------- Levels ----------

/** Player level from lifetime XP. Level 2 at 200 XP, quadratic growth after. */
export function levelFromXp(xp: number) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function xpForLevel(level: number) {
  return 50 * (level - 1) * (level - 1);
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - cur, needed: next - cur, nextLevel: level + 1 };
}

// ---------- Dates ----------

export function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000
  );
}

// ---------- Streaks (gentle: freezes cover gaps) ----------

export function updateStreak(child: {
  streak: number;
  bestStreak: number;
  streakFreezes: number;
  lastActiveDay: string | null;
}) {
  const today = todayStr();
  let { streak, streakFreezes } = child;

  if (child.lastActiveDay === today) {
    // already trained today — no change
  } else if (child.lastActiveDay === null) {
    streak = 1;
  } else {
    const gap = daysBetween(child.lastActiveDay, today);
    if (gap === 1) {
      streak += 1;
    } else if (gap - 1 <= streakFreezes) {
      // freezes cover the missed days; streak continues
      streakFreezes -= gap - 1;
      streak += 1;
    } else {
      streak = 1;
    }
  }

  // earn a freeze every 7 straight days, capped at 2
  if (child.lastActiveDay !== today && streak > 0 && streak % 7 === 0) {
    streakFreezes = Math.min(2, streakFreezes + 1);
  }

  return {
    streak,
    streakFreezes,
    bestStreak: Math.max(child.bestStreak, streak),
    lastActiveDay: today,
  };
}

// ---------- Badges ----------

export async function checkAndAwardBadges(childId: string): Promise<string[]> {
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    include: { skills: true, badges: true },
  });
  if (!child) return [];

  const owned = new Set(child.badges.map((b) => b.badgeId));
  const completedCount = await prisma.session.count({
    where: { childId, status: { in: ["COMPLETED", "PARTIAL"] } },
  });
  const weakFootSessions = await prisma.session.count({
    where: { childId, focus: "weak-foot", status: { in: ["COMPLETED", "PARTIAL"] } },
  });
  const skillCount = await prisma.skill.count();
  const level = levelFromXp(child.xp);

  const tiersHeld = child.skills.map((s) => s.tier);
  const has = (tier: string) =>
    tiersHeld.some((t) => TIERS.indexOf(t as (typeof TIERS)[number]) >= TIERS.indexOf(tier as (typeof TIERS)[number]));

  const candidates: [string, boolean][] = [
    ["first-session", completedCount >= 1],
    ["streak-3", child.streak >= 3],
    ["streak-7", child.streak >= 7],
    ["streak-30", child.streak >= 30],
    ["sessions-10", completedCount >= 10],
    ["sessions-50", completedCount >= 50],
    ["bronze-first", has("BRONZE")],
    ["silver-first", has("SILVER")],
    ["gold-first", has("GOLD")],
    ["elite-first", has("ELITE")],
    ["all-bronze", child.skills.length >= skillCount && child.skills.every((s) => s.tier !== "NONE")],
    ["level-5", level >= 5],
    ["level-10", level >= 10],
    ["early-bird", weakFootSessions >= 5],
  ];

  // plan-finisher: any active plan with all sessions done
  const plans = await prisma.trainingPlan.findMany({
    where: { childId },
    include: { sessions: { select: { status: true } } },
  });
  const planDone = plans.some(
    (p) => p.sessions.length > 0 && p.sessions.every((s) => s.status !== "PLANNED")
  );
  candidates.push(["plan-finisher", planDone]);

  const newBadges: string[] = [];
  for (const [badgeId, earned] of candidates) {
    if (earned && !owned.has(badgeId)) {
      await prisma.childBadge.create({ data: { childId, badgeId } });
      newBadges.push(badgeId);
    }
  }
  return newBadges;
}

// ---------- Progression Levels (TrainerRoad-style, 1.0–10.0) ----------

/**
 * After completing a drill, nudge the skill's Progression Level toward (and past)
 * the drill difficulty. Completing harder-than-current drills raises PL quickly;
 * easy drills maintain it. Struggling (ALL_OUT effort) gives a smaller bump.
 */
export function bumpProgressionLevel(currentPL: number, drillDifficulty: number, effort: string | null) {
  let delta: number;
  if (drillDifficulty >= currentPL) {
    // breakthrough: move 40% of the gap plus a small bonus
    delta = (drillDifficulty - currentPL) * 0.4 + 0.15;
  } else {
    // maintenance: tiny bump, decaying with how easy it was
    delta = Math.max(0.02, 0.1 - (currentPL - drillDifficulty) * 0.03);
  }
  if (effort === "ALL_OUT") delta *= 0.5; // barely survived — smaller jump
  if (effort === "EASY" && drillDifficulty >= currentPL) delta *= 1.3;
  return Math.min(10, Math.round((currentPL + delta) * 100) / 100);
}

// ---------- Session completion (the core engine) ----------

export type DrillOutcome = { sessionDrillId: string; completed: boolean; resultValue?: number };

/** Map a 1-10 session RPE onto the effort bands used to tune progression levels. */
export function effortFromRpe(rpe: number | null): string | null {
  if (rpe === null || Number.isNaN(rpe)) return null;
  if (rpe <= 3) return "EASY";
  if (rpe <= 6) return "MODERATE";
  if (rpe <= 8) return "HARD";
  return "ALL_OUT";
}

export async function processSessionCompletion(opts: {
  sessionId: string;
  childId: string;
  outcomes: DrillOutcome[];
  rpe: number | null;
  notes: string;
}) {
  const effort = effortFromRpe(opts.rpe);
  const session = await prisma.session.findUnique({
    where: { id: opts.sessionId },
    include: { drills: { include: { drill: { include: { skill: true } } } } },
  });
  if (!session || session.childId !== opts.childId) throw new Error("Session not found");
  if (session.status !== "PLANNED") throw new Error("Session already logged");

  const child = await prisma.childProfile.findUnique({ where: { id: opts.childId } });
  if (!child) throw new Error("Child not found");
  const age = ageFromBirthYear(child.birthYear);

  const outcomeMap = new Map(opts.outcomes.map((o) => [o.sessionDrillId, o]));
  let actualLoad = 0;
  let completedMinutes = 0;
  let completedDrills = 0;

  for (const sd of session.drills) {
    const outcome = outcomeMap.get(sd.id);
    const completed = outcome?.completed ?? false;
    const resultValue = outcome?.resultValue;

    await prisma.sessionDrill.update({
      where: { id: sd.id },
      data: { completed, resultValue: resultValue ?? null },
    });

    if (!completed) continue;
    completedDrills++;
    actualLoad += sd.drill.loadScore;
    completedMinutes += sd.drill.durationMin;

    // Progression level update
    const childSkill = await prisma.childSkill.upsert({
      where: { childId_skillId: { childId: opts.childId, skillId: sd.drill.skillId } },
      update: {},
      create: { childId: opts.childId, skillId: sd.drill.skillId },
    });
    const newPL = bumpProgressionLevel(childSkill.progressionLevel, sd.drill.difficulty, effort);

    // Benchmark result → tier
    let tier = childSkill.tier;
    let bestResult = childSkill.bestResult;
    if (sd.drill.targetMetric && resultValue !== undefined && resultValue !== null) {
      const benchmarks = JSON.parse(sd.drill.skill.benchmarks) as Benchmarks;
      await prisma.skillResult.create({
        data: { childId: opts.childId, skillId: sd.drill.skillId, value: resultValue },
      });
      if (bestResult === null || isBetterResult(benchmarks.direction, resultValue, bestResult)) {
        bestResult = resultValue;
        const newTier = tierForResult(benchmarks, age, resultValue);
        if (TIERS.indexOf(newTier) > TIERS.indexOf(tier as (typeof TIERS)[number])) tier = newTier;
      }
    }

    await prisma.childSkill.update({
      where: { id: childSkill.id },
      data: { progressionLevel: newPL, tier, bestResult },
    });
  }

  const total = session.drills.length;
  const status = completedDrills === 0 ? "SKIPPED" : completedDrills === total ? "COMPLETED" : "PARTIAL";

  // Session-RPE training load (RPE × minutes) feeds the fitness/fatigue model.
  const trainingLoad = opts.rpe && completedMinutes > 0 ? opts.rpe * completedMinutes : 0;

  await prisma.session.update({
    where: { id: session.id },
    data: {
      status,
      actualLoad,
      rpe: opts.rpe,
      trainingLoad,
      effort,
      notes: opts.notes,
      completedAt: new Date(),
    },
  });

  let xpEarned = 0;
  if (status !== "SKIPPED") {
    const streakData = updateStreak(child);
    // XP scales with session-RPE load (RPE × minutes), so harder/longer sessions
    // earn more. Divided by RPE_XP_DIVISOR to keep rewards on the previous scale.
    // Falls back to the drill loadScore sum if no RPE was recorded.
    const RPE_XP_DIVISOR = 5;
    const loadXp = trainingLoad > 0 ? Math.round(trainingLoad / RPE_XP_DIVISOR) : actualLoad * 2;
    xpEarned = loadXp + Math.min(streakData.streak, 10) * 5;
    if (status === "COMPLETED") xpEarned += 20; // full-completion bonus
    await prisma.childProfile.update({
      where: { id: child.id },
      data: { ...streakData, xp: child.xp + xpEarned },
    });
  }

  const newBadges = await checkAndAwardBadges(child.id);
  return { status, actualLoad, xpEarned, newBadges };
}
