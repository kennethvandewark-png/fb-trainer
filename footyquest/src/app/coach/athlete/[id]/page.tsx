import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { assignSession, addFeedback } from "@/lib/actions";
import { UserNav } from "@/components/nav";
import { ActionForm, SubmitButton } from "@/components/ui";
import { ProgressionBar, StatusPill, FitnessChart } from "@/components/stats";
import { levelFromXp, todayStr, addDays } from "@/lib/gamification";
import { buildFitnessSeries } from "@/lib/trainingload";
import { TIER_META, Tier, ageFromBirthYear } from "@/lib/benchmarks";

export default async function AthletePage({ params }: { params: Promise<{ id: string }> }) {
  const coach = await requireUser("COACH");
  if (!coach) redirect("/login");
  const { id } = await params;

  const link = await prisma.coachLink.findUnique({
    where: { coachId_childId: { coachId: coach.id, childId: id } },
    include: { child: { include: { skills: { include: { skill: true }, orderBy: { progressionLevel: "desc" } } } } },
  });
  if (!link) notFound();
  const child = link.child;

  const today = todayStr();
  const [upcoming, recent, skills, loadSessions] = await Promise.all([
    prisma.session.findMany({
      where: { childId: child.id, date: { gte: today } },
      orderBy: { date: "asc" },
      take: 6,
    }),
    prisma.session.findMany({
      where: { childId: child.id, status: { not: "PLANNED" } },
      include: { feedbacks: true, drills: { include: { drill: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.skill.findMany({ include: { drills: { orderBy: { difficulty: "asc" } } }, orderBy: { name: "asc" } }),
    prisma.session.findMany({
      where: { childId: child.id, date: { gte: addDays(today, -83), lte: today } },
      select: { date: true, trainingLoad: true },
    }),
  ]);

  const fitnessSeries = buildFitnessSeries(loadSessions);

  return (
    <div>
      <UserNav name={coach.name} role="COACH" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <Link href="/coach" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← All players
        </Link>

        <div className="card flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-xl bg-zinc-800 text-3xl">{child.avatar}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-black">{child.name}</h1>
            <p className="text-sm text-zinc-400">
              Age {ageFromBirthYear(child.birthYear)} · Level {levelFromXp(child.xp)} · {child.xp.toLocaleString()} XP ·{" "}
              {child.streak}🔥 streak
            </p>
          </div>
        </div>

        <section className="card">
          <h2 className="mb-4 text-lg font-bold">Fitness &amp; Freshness (load model)</h2>
          <FitnessChart series={fitnessSeries} technical />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card">
            <h2 className="mb-4 text-lg font-bold">Skill progression</h2>
            {child.skills.length === 0 ? (
              <p className="text-sm text-zinc-400">No training data yet.</p>
            ) : (
              <div className="space-y-3">
                {child.skills.map((cs) => (
                  <div key={cs.id} className="flex items-center gap-3">
                    <span className="w-6 text-lg">{cs.skill.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span>{cs.skill.name}</span>
                        <span className={TIER_META[cs.tier as Tier].color}>
                          {TIER_META[cs.tier as Tier].icon}
                          {cs.bestResult != null && <span className="ml-1 text-zinc-500">best {cs.bestResult}</span>}
                        </span>
                      </div>
                      <ProgressionBar level={cs.progressionLevel} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="mb-4 text-lg font-bold">Assign a session</h2>
            <ActionForm action={assignSession}>
              <input type="hidden" name="childId" value={child.id} />
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Date</label>
                    <input type="date" name="date" min={today} defaultValue={today} className="input" required />
                  </div>
                  <div>
                    <label className="label">Title</label>
                    <input name="title" className="input" placeholder="Shooting session" required />
                  </div>
                </div>
                <div>
                  <label className="label">Drills</label>
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-zinc-800 p-2">
                    {skills.map((s) =>
                      s.drills.map((d) => (
                        <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-zinc-800">
                          <input type="checkbox" name="drillIds" value={d.id} className="h-4 w-4 accent-emerald-500" />
                          <span className="flex-1">
                            {s.icon} {d.name}
                          </span>
                          <span className="text-xs text-zinc-500">
                            diff {d.difficulty.toFixed(1)} · {d.durationMin}m
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                <SubmitButton>Assign session</SubmitButton>
              </div>
            </ActionForm>
          </section>
        </div>

        <section className="card">
          <h2 className="mb-4 text-lg font-bold">Upcoming sessions</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-zinc-400">Nothing scheduled.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2 text-sm">
                  <span className="font-medium">{s.title}</span>
                  <span className="flex items-center gap-3 text-zinc-400">
                    {s.date} <StatusPill status={s.status} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-lg font-bold">Recent training — leave feedback</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-400">No completed sessions yet.</p>
          ) : (
            <div className="space-y-4">
              {recent.map((s) => (
                <div key={s.id} className="rounded-xl border border-zinc-800 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold">{s.title}</span>
                      <span className="ml-2 text-sm text-zinc-400">
                        {s.date} · load {s.actualLoad}/{s.plannedLoad}
                        {s.effort && <> · felt {s.effort.replace("_", " ").toLowerCase()}</>}
                      </span>
                    </div>
                    <StatusPill status={s.status} />
                  </div>
                  {s.notes && <p className="mt-1 text-sm text-zinc-400">Player notes: {s.notes}</p>}
                  <div className="mt-2 text-sm text-zinc-400">
                    {s.drills.map((d) => (
                      <span key={d.id} className="mr-3">
                        {d.completed ? "✓" : "✗"} {d.drill.name}
                        {d.resultValue != null && ` (${d.resultValue})`}
                      </span>
                    ))}
                  </div>
                  {s.feedbacks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {s.feedbacks.map((f) => (
                        <p key={f.id} className="rounded-lg bg-emerald-950/40 px-3 py-1.5 text-sm text-emerald-300">
                          {f.message}
                        </p>
                      ))}
                    </div>
                  )}
                  <ActionForm action={addFeedback} className="mt-3">
                    <input type="hidden" name="sessionId" value={s.id} />
                    <div className="flex gap-2">
                      <input name="message" className="input !py-1.5" placeholder="Great effort on the weak foot work…" required />
                      <SubmitButton className="btn-secondary !py-1.5 text-sm whitespace-nowrap">Send</SubmitButton>
                    </div>
                  </ActionForm>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
