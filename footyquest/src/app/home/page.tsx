import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireChild } from "@/lib/auth";
import { todayStr, addDays } from "@/lib/gamification";
import { ChildNav } from "@/components/nav";
import { StatCard, XpBar, LoadChart, FitnessChart, StatusPill } from "@/components/stats";
import { createQuickSession } from "@/lib/actions";
import { buildFitnessSeries } from "@/lib/trainingload";
import { TIER_META, Tier } from "@/lib/benchmarks";

export default async function HomePage() {
  const child = await requireChild();
  if (!child) redirect("/login/child");

  const today = todayStr();
  const [todaySessions, upcoming, plan, skills, recentFeedback, weekSessions, loadSessions] = await Promise.all([
    prisma.session.findMany({
      where: { childId: child.id, date: today },
      include: { drills: { include: { drill: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.session.findMany({
      where: { childId: child.id, date: { gt: today }, status: "PLANNED" },
      orderBy: { date: "asc" },
      take: 3,
    }),
    prisma.trainingPlan.findFirst({ where: { childId: child.id, active: true } }),
    prisma.childSkill.findMany({
      where: { childId: child.id },
      include: { skill: true },
      orderBy: { progressionLevel: "desc" },
      take: 3,
    }),
    prisma.feedback.findMany({
      where: { session: { childId: child.id } },
      include: { coach: true, session: true },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    prisma.session.findMany({
      where: { childId: child.id, date: { gte: addDays(today, -27), lte: addDays(today, 7) } },
    }),
    prisma.session.findMany({
      where: { childId: child.id, date: { gte: addDays(today, -83), lte: today } },
      select: { date: true, trainingLoad: true },
    }),
  ]);

  const fitnessSeries = buildFitnessSeries(loadSessions);

  // last 4 weeks + current week of load
  const weeks: { label: string; planned: number; actual: number }[] = [];
  for (let w = 4; w >= 0; w--) {
    const start = addDays(today, -7 * w - new Date(today + "T00:00:00Z").getUTCDay() + 1);
    const end = addDays(start, 6);
    const inWeek = weekSessions.filter((s) => s.date >= start && s.date <= end);
    weeks.push({
      label: w === 0 ? "This wk" : `-${w} wk`,
      planned: inWeek.reduce((sum, s) => sum + s.plannedLoad, 0),
      actual: inWeek.reduce((sum, s) => sum + s.actualLoad, 0),
    });
  }

  const pending = todaySessions.filter((s) => s.status === "PLANNED");
  const doneToday = todaySessions.some((s) => s.status === "COMPLETED" || s.status === "PARTIAL");

  return (
    <div>
      <ChildNav name={child.name} avatar={child.avatar} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="card bg-gradient-to-br from-zinc-900 to-emerald-950/40">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-black">
              {doneToday ? "Great work today," : "Ready to train,"} {child.name}? {child.avatar}
            </h1>
          </div>
          <XpBar xp={child.xp} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="🔥" label="Day streak" value={String(child.streak)} sub={child.streakFreezes > 0 ? `${child.streakFreezes} freeze${child.streakFreezes > 1 ? "s" : ""} banked` : undefined} />
          <StatCard icon="🏆" label="Best streak" value={String(child.bestStreak)} />
          <StatCard icon="⚡" label="Total XP" value={child.xp.toLocaleString()} />
          <StatCard icon="📅" label="Plan" value={plan ? `Wk view` : "None"} sub={plan ? plan.name.slice(0, 24) : "Generate one!"} />
        </div>

        <section className="card">
          <h2 className="mb-4 text-lg font-bold">Today&apos;s training</h2>
          {todaySessions.length === 0 && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-zinc-400">
                Nothing scheduled today.{" "}
                {plan ? "Enjoy the rest day — recovery is training too." : "Generate a plan or jump into a quick session."}
              </p>
              <div className="flex flex-wrap gap-2">
                {!plan && (
                  <Link href="/plan/new" className="btn-primary">
                    🤖 Generate my training plan
                  </Link>
                )}
                <form action={createQuickSession}>
                  <button className="btn-secondary">⚡ Quick session now</button>
                </form>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {todaySessions.map((s) => (
              <Link
                key={s.id}
                href={`/session/${s.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 transition hover:border-emerald-600"
              >
                <div>
                  <div className="font-bold">{s.title}</div>
                  <div className="text-sm text-zinc-400">
                    {s.drills.length} drill{s.drills.length !== 1 ? "s" : ""} ·{" "}
                    {s.drills.reduce((sum, d) => sum + d.drill.durationMin, 0)} min · load {s.plannedLoad}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={s.status} />
                  {s.status === "PLANNED" && <span className="text-emerald-400">Start →</span>}
                </div>
              </Link>
            ))}
          </div>
          {pending.length === 0 && todaySessions.length > 0 && (
            <form action={createQuickSession} className="mt-4">
              <button className="btn-secondary">⚡ Bonus quick session</button>
            </form>
          )}
        </section>

        <section className="card">
          <h2 className="mb-4 text-lg font-bold">Fitness &amp; Freshness</h2>
          <FitnessChart series={fitnessSeries} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card">
            <h2 className="mb-4 text-lg font-bold">Training load (5 weeks)</h2>
            <LoadChart weeks={weeks} />
          </section>

          <section className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Top skills</h2>
              <Link href="/skills" className="text-sm text-emerald-400 hover:underline">
                All skills →
              </Link>
            </div>
            {skills.length === 0 ? (
              <p className="text-sm text-zinc-400">Complete sessions to start building progression levels.</p>
            ) : (
              <div className="space-y-3">
                {skills.map((cs) => (
                  <div key={cs.id} className="flex items-center gap-3">
                    <span className="text-xl">{cs.skill.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cs.skill.name}</span>
                        <span className={TIER_META[cs.tier as Tier].color}>
                          {TIER_META[cs.tier as Tier].icon} {TIER_META[cs.tier as Tier].label}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-sky-600 to-sky-400"
                          style={{ width: `${(cs.progressionLevel / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right text-sm font-bold text-sky-400">
                      {cs.progressionLevel.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {(upcoming.length > 0 || recentFeedback.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Coming up</h2>
                <Link href="/calendar" className="text-sm text-emerald-400 hover:underline">
                  Calendar →
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-sm text-zinc-400">No upcoming sessions scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((s) => (
                    <Link key={s.id} href={`/session/${s.id}`} className="flex justify-between rounded-lg px-3 py-2 hover:bg-zinc-800">
                      <span className="text-sm font-medium">{s.title}</span>
                      <span className="text-sm text-zinc-400">{s.date}</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <h2 className="mb-4 text-lg font-bold">Coach feedback</h2>
              {recentFeedback.length === 0 ? (
                <p className="text-sm text-zinc-400">No feedback yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentFeedback.map((f) => (
                    <div key={f.id} className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
                      <p className="text-sm">{f.message}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        — Coach {f.coach.name} · {f.session.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
