"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import {
  createSession,
  clearSession,
  hashSecret,
  verifySecret,
  requireChild,
  requireUser,
} from "./auth";
import { processSessionCompletion, todayStr } from "./gamification";
import { generateAiPlan, savePlan } from "./plans";
import { ageFromBirthYear, tierForResult, isBetterResult, TIERS, Benchmarks } from "./benchmarks";

export type ActionState = { error?: string; success?: string } | null;

// ---------- Auth ----------

export async function registerUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "PARENT");

  if (!name || !email || password.length < 6) {
    return { error: "Fill in all fields — password needs at least 6 characters." };
  }
  if (role !== "PARENT" && role !== "COACH") return { error: "Invalid role." };
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists." };
  }

  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await hashSecret(password) },
  });
  await createSession({ kind: "user", id: user.id, role: role as "PARENT" | "COACH" });
  redirect(role === "PARENT" ? "/parent" : "/coach");
}

export async function loginUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifySecret(password, user.passwordHash))) {
    return { error: "Wrong email or password." };
  }
  await createSession({ kind: "user", id: user.id, role: user.role as "PARENT" | "COACH" });
  redirect(user.role === "PARENT" ? "/parent" : "/coach");
}

export async function loginChild(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const pin = String(formData.get("pin") ?? "");
  const child = await prisma.childProfile.findUnique({ where: { username } });
  if (!child || !(await verifySecret(pin, child.pinHash))) {
    return { error: "Wrong username or PIN." };
  }
  await createSession({ kind: "child", id: child.id });
  redirect("/home");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

// ---------- Parent ----------

export async function addChild(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parent = await requireUser("PARENT");
  if (!parent) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const pin = String(formData.get("pin") ?? "");
  const birthYear = Number(formData.get("birthYear"));
  const avatar = String(formData.get("avatar") ?? "⚽");
  const goal = String(formData.get("goal") ?? "HAVE_FUN");

  if (!name || !username) return { error: "Name and username are required." };
  if (!/^\d{4}$/.test(pin)) return { error: "PIN must be exactly 4 digits." };
  const age = ageFromBirthYear(birthYear);
  if (!birthYear || age < 5 || age > 18) return { error: "Birth year must make the child 5-18 years old." };
  if (await prisma.childProfile.findUnique({ where: { username } })) {
    return { error: "That username is taken — try another." };
  }

  await prisma.childProfile.create({
    data: { parentId: parent.id, name, username, pinHash: await hashSecret(pin), birthYear, avatar, goal },
  });
  revalidatePath("/parent");
  return { success: `${name} added! They can log in with username "${username}" and their PIN.` };
}

export async function generateInviteCode(childId: string) {
  const parent = await requireUser("PARENT");
  if (!parent) redirect("/login");
  const child = await prisma.childProfile.findFirst({ where: { id: childId, parentId: parent.id } });
  if (!child) return;

  // Unambiguous alphabet: no 0/O, 1/I/L, or other look-alikes
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const code = Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
  await prisma.inviteCode.create({ data: { code, childId } });
  revalidatePath("/parent");
}

export async function removeCoach(linkId: string) {
  const parent = await requireUser("PARENT");
  if (!parent) redirect("/login");
  const link = await prisma.coachLink.findUnique({ where: { id: linkId }, include: { child: true } });
  if (link && link.child.parentId === parent.id) {
    await prisma.coachLink.delete({ where: { id: linkId } });
  }
  revalidatePath("/parent");
}

// ---------- Coach ----------

export async function linkAthlete(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const coach = await requireUser("COACH");
  if (!coach) redirect("/login");

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const invite = await prisma.inviteCode.findUnique({ where: { code }, include: { child: true } });
  if (!invite || invite.usedById) return { error: "That code is invalid or already used." };

  const existing = await prisma.coachLink.findUnique({
    where: { coachId_childId: { coachId: coach.id, childId: invite.childId } },
  });
  if (existing) return { error: "You are already linked to this player." };

  await prisma.coachLink.create({ data: { coachId: coach.id, childId: invite.childId } });
  await prisma.inviteCode.update({ where: { code }, data: { usedById: coach.id } });
  revalidatePath("/coach");
  return { success: `Linked to ${invite.child.name}!` };
}

async function coachOwnsChild(coachId: string, childId: string) {
  return prisma.coachLink.findUnique({ where: { coachId_childId: { coachId, childId } } });
}

export async function assignSession(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const coach = await requireUser("COACH");
  if (!coach) redirect("/login");

  const childId = String(formData.get("childId"));
  const date = String(formData.get("date"));
  const title = String(formData.get("title") ?? "").trim();
  const drillIds = formData.getAll("drillIds").map(String);

  if (!(await coachOwnsChild(coach.id, childId))) return { error: "Not linked to this player." };
  if (!date || !title) return { error: "Date and title are required." };
  if (drillIds.length === 0) return { error: "Pick at least one drill." };

  const drills = await prisma.drill.findMany({ where: { id: { in: drillIds } } });
  const plannedLoad = drills.reduce((s, d) => s + d.loadScore, 0);
  const focus = drills.length === 1 ? drills[0].skillId : "mixed";

  await prisma.session.create({
    data: {
      childId,
      date,
      title,
      focus,
      plannedLoad,
      assignedById: coach.id,
      drills: { create: drillIds.map((id, i) => ({ drillId: id, order: i })) },
    },
  });
  revalidatePath(`/coach/athlete/${childId}`);
  return { success: "Session assigned!" };
}

export async function addFeedback(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const coach = await requireUser("COACH");
  if (!coach) redirect("/login");

  const sessionId = String(formData.get("sessionId"));
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Write some feedback first." };

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || !(await coachOwnsChild(coach.id, session.childId))) {
    return { error: "Not linked to this player." };
  }
  await prisma.feedback.create({ data: { sessionId, coachId: coach.id, message } });
  revalidatePath(`/coach/athlete/${session.childId}`);
  return { success: "Feedback sent!" };
}

// ---------- Child: plans & sessions ----------

export async function generatePlanAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const child = await requireChild();
  if (!child) redirect("/login/child");

  const weeks = Number(formData.get("weeks") ?? 4);
  const weekdays = formData.getAll("weekdays").map(Number);
  const focusSkills = formData.getAll("focusSkills").map(String);
  const goal = String(formData.get("goal") ?? child.goal);

  if (weekdays.length === 0) return { error: "Pick at least one training day." };
  if (weekdays.length > 6) return { error: "Keep at least one full rest day per week." };
  if (![4, 6, 8, 12].includes(weeks)) return { error: "Choose a valid plan length." };

  const req = { childId: child.id, goal, weeks, daysPerWeek: weekdays.length, weekdays, focusSkills };
  const { spec, source } = await generateAiPlan(req);
  await savePlan(req, spec, source);
  await prisma.childProfile.update({ where: { id: child.id }, data: { goal } });

  revalidatePath("/home");
  revalidatePath("/calendar");
  redirect("/calendar?created=1");
}

export async function completeSessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const child = await requireChild();
  if (!child) redirect("/login/child");

  const sessionId = String(formData.get("sessionId"));
  const effort = String(formData.get("effort") ?? "") || null;
  const notes = String(formData.get("notes") ?? "").trim();

  const sessionDrillIds = formData.getAll("sessionDrillIds").map(String);
  const outcomes = sessionDrillIds.map((id) => {
    const raw = formData.get(`result_${id}`);
    const resultValue = raw !== null && String(raw).trim() !== "" ? Number(raw) : undefined;
    return {
      sessionDrillId: id,
      completed: formData.get(`done_${id}`) === "on",
      resultValue: resultValue !== undefined && !Number.isNaN(resultValue) ? resultValue : undefined,
    };
  });

  try {
    const result = await processSessionCompletion({
      sessionId,
      childId: child.id,
      outcomes,
      effort,
      notes,
    });
    revalidatePath("/home");
    revalidatePath("/calendar");
    revalidatePath(`/session/${sessionId}`);
    const badgeMsg = result.newBadges.length ? ` New badge${result.newBadges.length > 1 ? "s" : ""} earned!` : "";
    return {
      success:
        result.status === "SKIPPED"
          ? "Session logged as skipped. Tomorrow is a new day!"
          : `Session logged: +${result.xpEarned} XP.${badgeMsg}`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not log session." };
  }
}

export async function recordBenchmark(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const child = await requireChild();
  if (!child) redirect("/login/child");

  const skillId = String(formData.get("skillId"));
  const value = Number(formData.get("value"));
  if (Number.isNaN(value) || value <= 0) return { error: "Enter a valid number." };

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) return { error: "Skill not found." };
  const benchmarks = JSON.parse(skill.benchmarks) as Benchmarks;
  const age = ageFromBirthYear(child.birthYear);

  await prisma.skillResult.create({ data: { childId: child.id, skillId, value } });

  const childSkill = await prisma.childSkill.upsert({
    where: { childId_skillId: { childId: child.id, skillId } },
    update: {},
    create: { childId: child.id, skillId },
  });

  let { tier, bestResult } = childSkill;
  if (bestResult === null || isBetterResult(benchmarks.direction, value, bestResult)) {
    bestResult = value;
    const newTier = tierForResult(benchmarks, age, value);
    if (TIERS.indexOf(newTier) > TIERS.indexOf(tier as (typeof TIERS)[number])) tier = newTier;
  }
  await prisma.childSkill.update({ where: { id: childSkill.id }, data: { tier, bestResult } });

  const { checkAndAwardBadges } = await import("./gamification");
  const newBadges = await checkAndAwardBadges(child.id);

  revalidatePath("/skills");
  const tierMsg = tier !== childSkill.tier ? ` ${tier} tier unlocked!` : "";
  const badgeMsg = newBadges.length ? " New badge earned!" : "";
  return { success: `Test result saved.${tierMsg}${badgeMsg}` };
}

// ---------- Quick session (train today without a plan) ----------

export async function createQuickSession() {
  const child = await requireChild();
  if (!child) redirect("/login/child");

  const skills = await prisma.childSkill.findMany({ where: { childId: child.id } });
  const plMap = new Map(skills.map((s) => [s.skillId, s.progressionLevel]));
  const allSkills = await prisma.skill.findMany({ include: { drills: true } });
  const weakest = [...allSkills].sort((a, b) => (plMap.get(a.id) ?? 1) - (plMap.get(b.id) ?? 1))[0];
  const pl = plMap.get(weakest.id) ?? 1;
  const drills = [...weakest.drills]
    .sort((a, b) => Math.abs(a.difficulty - pl) - Math.abs(b.difficulty - pl))
    .slice(0, 2);

  const session = await prisma.session.create({
    data: {
      childId: child.id,
      date: todayStr(),
      title: `Quick Session: ${weakest.name}`,
      focus: weakest.id,
      plannedLoad: drills.reduce((s, d) => s + d.loadScore, 0),
      drills: { create: drills.map((d, i) => ({ drillId: d.id, order: i })) },
    },
  });
  redirect(`/session/${session.id}`);
}
