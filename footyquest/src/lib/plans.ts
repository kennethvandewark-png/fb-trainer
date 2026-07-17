import { prisma } from "./db";
import { ageFromBirthYear } from "./benchmarks";
import { addDays, todayStr } from "./gamification";

export type PlanSessionSpec = {
  week: number; // 1-based
  dayIndex: number; // index into chosen weekdays for that week
  title: string;
  focus: string; // skill id or "mixed"
  drillIds: string[];
};

export type PlanSpec = {
  name: string;
  summary: string;
  sessions: PlanSessionSpec[];
};

export type PlanRequest = {
  childId: string;
  goal: string; // HAVE_FUN | MAKE_TEAM | ELITE | PRO
  weeks: number;
  daysPerWeek: number;
  weekdays: number[]; // 0=Sun..6=Sat, chosen training days
  focusSkills: string[]; // skill ids the child wants to prioritize
};

const GOAL_LABELS: Record<string, string> = {
  HAVE_FUN: "have fun and improve",
  MAKE_TEAM: "make a competitive team",
  ELITE: "reach elite academy level",
  PRO: "work toward professional soccer",
};

/**
 * Evidence-based rules generator (TrainerRoad-style periodization for youth):
 * - Progressive overload: drill difficulty tracks the child's Progression Level,
 *   stepping up ~0.4 PL per week within the plan.
 * - Capped ramp: weekly load grows ~8%, with a recovery week every 4th week
 *   (-30% load) per youth LTAD guidance.
 * - Focus rotation: weakest skills and chosen priorities appear most often;
 *   every week still touches multiple skills (varied practice beats blocked).
 * - Age-appropriate: sessions built from 2 drills (~20-30 min) for U12,
 *   up to 3 drills (~35-45 min) for 13+.
 */
export async function generateRulesPlan(req: PlanRequest): Promise<PlanSpec> {
  const child = await prisma.childProfile.findUnique({
    where: { id: req.childId },
    include: { skills: true },
  });
  if (!child) throw new Error("Child not found");
  const age = ageFromBirthYear(child.birthYear);
  const drillsPerSession = age <= 12 ? 2 : 3;

  const allSkills = await prisma.skill.findMany({ include: { drills: true } });
  const plMap = new Map(child.skills.map((s) => [s.skillId, s.progressionLevel]));

  // Priority: chosen focus skills first, then weakest progression levels
  const ranked = [...allSkills].sort((a, b) => {
    const aFocus = req.focusSkills.includes(a.id) ? 0 : 1;
    const bFocus = req.focusSkills.includes(b.id) ? 0 : 1;
    if (aFocus !== bFocus) return aFocus - bFocus;
    return (plMap.get(a.id) ?? 1) - (plMap.get(b.id) ?? 1);
  });

  const sessions: PlanSessionSpec[] = [];
  let rotation = 0;

  for (let week = 1; week <= req.weeks; week++) {
    const isRecovery = week % 4 === 0 && req.weeks >= 4;
    // difficulty target ramps ~0.4/wk from just below current PL
    for (let day = 0; day < req.daysPerWeek; day++) {
      const focusSkill = ranked[rotation % ranked.length];
      rotation++;
      const pl = plMap.get(focusSkill.id) ?? 1;
      const targetDiff = isRecovery ? Math.max(1, pl - 1) : pl - 0.5 + week * 0.4;

      // primary drills: closest difficulty from the focus skill
      const byCloseness = [...focusSkill.drills].sort(
        (a, b) => Math.abs(a.difficulty - targetDiff) - Math.abs(b.difficulty - targetDiff)
      );
      const chosen = byCloseness.slice(0, Math.min(2, drillsPerSession));

      // complementary drill from the next skill in rotation for varied practice
      if (chosen.length < drillsPerSession) {
        const compSkill = ranked[rotation % ranked.length];
        const compPl = plMap.get(compSkill.id) ?? 1;
        const comp = [...compSkill.drills].sort(
          (a, b) => Math.abs(a.difficulty - compPl) - Math.abs(b.difficulty - compPl)
        )[0];
        if (comp) chosen.push(comp);
      }

      sessions.push({
        week,
        dayIndex: day,
        title: `${isRecovery ? "Recovery: " : ""}${focusSkill.name} Focus`,
        focus: focusSkill.id,
        drillIds: chosen.map((d) => d.id),
      });
    }
  }

  return {
    name: `${req.weeks}-Week ${GOAL_LABELS[req.goal] ?? "Development"} Plan`,
    summary:
      `A ${req.weeks}-week progressive plan (${req.daysPerWeek} sessions/week) built around ` +
      `${ranked.slice(0, 3).map((s) => s.name).join(", ")}. Load ramps gradually with a lighter ` +
      `recovery week every 4th week, following youth long-term athletic development guidance.`,
    sessions,
  };
}

/** AI generator via OpenAI; falls back to the rules engine on any failure. */
export async function generateAiPlan(req: PlanRequest): Promise<{ spec: PlanSpec; source: "AI" | "RULES" }> {
  if (!process.env.OPENAI_API_KEY) {
    return { spec: await generateRulesPlan(req), source: "RULES" };
  }
  try {
    const child = await prisma.childProfile.findUnique({
      where: { id: req.childId },
      include: { skills: { include: { skill: true } } },
    });
    if (!child) throw new Error("Child not found");
    const age = ageFromBirthYear(child.birthYear);
    const drills = await prisma.drill.findMany({ select: { id: true, skillId: true, name: true, difficulty: true, durationMin: true } });

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI();

    const prompt = `You are a youth soccer development coach designing a TrainerRoad-style structured training plan.

ATHLETE: age ${age}, goal: ${GOAL_LABELS[req.goal]}.
Current skill progression levels (1.0-10.0 scale): ${
      child.skills.length
        ? child.skills.map((s) => `${s.skill.name}: ${s.progressionLevel}`).join(", ")
        : "beginner across all skills (1.0)"
    }.
Priority skills chosen by athlete: ${req.focusSkills.join(", ") || "none — you decide from weakest skills"}.

PLAN SHAPE: ${req.weeks} weeks, exactly ${req.daysPerWeek} sessions per week.

AVAILABLE DRILLS (id | skill | difficulty | minutes):
${drills.map((d) => `${d.id} | ${d.skillId} | ${d.difficulty} | ${d.durationMin}`).join("\n")}

EVIDENCE-BASED RULES you must follow:
- Progressive overload: drill difficulty near the athlete's progression level, ramping up over the weeks.
- Weekly training load must not ramp more than ~10%; make every 4th week a lighter recovery week.
- ${age <= 12 ? "2 drills per session (age-appropriate, 20-30 min)" : "3 drills per session (35-45 min)"}.
- Rotate focus across skills (varied practice), emphasizing priorities and weaknesses.

Respond with ONLY JSON matching:
{"name": string, "summary": string (2 sentences), "sessions": [{"week": 1-based int, "dayIndex": 0-based int < ${req.daysPerWeek}, "title": string, "focus": skillId, "drillIds": [drill ids]}]}
The sessions array must contain exactly ${req.weeks * req.daysPerWeek} entries.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const spec = JSON.parse(raw) as PlanSpec;

    // Validate: correct count, known drill ids
    const validIds = new Set(drills.map((d) => d.id));
    if (!Array.isArray(spec.sessions) || spec.sessions.length === 0) throw new Error("bad plan");
    spec.sessions = spec.sessions
      .filter((s) => s.week >= 1 && s.week <= req.weeks && s.dayIndex >= 0 && s.dayIndex < req.daysPerWeek)
      .map((s) => ({ ...s, drillIds: s.drillIds.filter((id) => validIds.has(id)) }))
      .filter((s) => s.drillIds.length > 0);
    if (spec.sessions.length < req.weeks * req.daysPerWeek * 0.7) throw new Error("plan too sparse");

    return { spec, source: "AI" };
  } catch (err) {
    console.error("AI plan generation failed, falling back to rules engine:", err);
    return { spec: await generateRulesPlan(req), source: "RULES" };
  }
}

/** Persist a PlanSpec: deactivate old plans, create plan + calendar sessions. */
export async function savePlan(req: PlanRequest, spec: PlanSpec, source: "AI" | "RULES" | "COACH") {
  const drillsById = new Map(
    (await prisma.drill.findMany()).map((d) => [d.id, d])
  );

  // Replace any current active plan(s): deactivate them AND remove their
  // still-PLANNED sessions so leftover future/missed sessions don't linger on
  // the calendar, in upcoming lists, or in compliance math. Sessions the child
  // already acted on (COMPLETED/PARTIAL/SKIPPED) are kept as history.
  const outgoingPlans = await prisma.trainingPlan.findMany({
    where: { childId: req.childId, active: true },
    select: { id: true },
  });

  if (outgoingPlans.length > 0) {
    const outgoingIds = outgoingPlans.map((p) => p.id);
    await prisma.session.deleteMany({
      where: { planId: { in: outgoingIds }, status: "PLANNED" },
    });
    await prisma.trainingPlan.updateMany({
      where: { id: { in: outgoingIds } },
      data: { active: false },
    });
  }

  const plan = await prisma.trainingPlan.create({
    data: {
      childId: req.childId,
      name: spec.name,
      goal: req.goal,
      weeks: req.weeks,
      source,
      summary: spec.summary,
    },
  });

  // Map week/dayIndex to real dates: find next occurrence of each chosen weekday
  const today = todayStr();
  const sortedWeekdays = [...req.weekdays].sort((a, b) => a - b);
  const startDow = new Date(today + "T00:00:00Z").getUTCDay();

  for (const s of spec.sessions) {
    const weekday = sortedWeekdays[s.dayIndex % sortedWeekdays.length];
    // first occurrence of this weekday strictly after today
    let offset = (weekday - startDow + 7) % 7;
    if (offset === 0) offset = 7;
    const date = addDays(today, offset + (s.week - 1) * 7);

    const drillIds = s.drillIds.filter((id) => drillsById.has(id));
    const plannedLoad = drillIds.reduce((sum, id) => sum + (drillsById.get(id)?.loadScore ?? 0), 0);

    await prisma.session.create({
      data: {
        childId: req.childId,
        planId: plan.id,
        date,
        title: s.title,
        focus: s.focus,
        plannedLoad,
        drills: { create: drillIds.map((id, i) => ({ drillId: id, order: i })) },
      },
    });
  }

  return plan;
}
