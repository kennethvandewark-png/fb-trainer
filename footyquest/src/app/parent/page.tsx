import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addChild, generateInviteCode, removeCoach } from "@/lib/actions";
import { UserNav } from "@/components/nav";
import { ActionForm, SubmitButton } from "@/components/ui";
import { FitnessChart } from "@/components/stats";
import { levelFromXp, todayStr, addDays } from "@/lib/gamification";
import { buildFitnessSeries } from "@/lib/trainingload";
import { TIER_META, Tier, ageFromBirthYear } from "@/lib/benchmarks";

export default async function ParentPage() {
  const parent = await requireUser("PARENT");
  if (!parent) redirect("/login");

  const children = await prisma.childProfile.findMany({
    where: { parentId: parent.id },
    include: {
      skills: { include: { skill: true } },
      coachLinks: { include: { coach: true } },
      inviteCodes: { where: { usedById: null }, orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { sessions: { where: { status: { in: ["COMPLETED", "PARTIAL"] } } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const thisYear = new Date().getFullYear();

  const today = todayStr();
  const childIds = children.map((c) => c.id);
  const loadSessions = childIds.length
    ? await prisma.session.findMany({
        where: { childId: { in: childIds }, date: { gte: addDays(today, -83), lte: today } },
        select: { childId: true, date: true, trainingLoad: true },
      })
    : [];
  const seriesByChild = new Map(
    childIds.map((id) => [id, buildFitnessSeries(loadSessions.filter((s) => s.childId === id))])
  );

  return (
    <div>
      <UserNav name={parent.name} role="PARENT" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-black">Family dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your players, watch their progress, and connect coaches with invite codes.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {children.map((c) => {
            const level = levelFromXp(c.xp);
            const bestTiers = c.skills
              .filter((s) => s.tier !== "NONE")
              .sort((a, b) => b.progressionLevel - a.progressionLevel)
              .slice(0, 3);
            return (
              <div key={c.id} className="card">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-zinc-800 text-2xl">{c.avatar}</span>
                  <div>
                    <h2 className="text-lg font-bold leading-tight">{c.name}</h2>
                    <p className="text-sm text-zinc-400">
                      @{c.username} · age {ageFromBirthYear(c.birthYear)}
                    </p>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Level", String(level)],
                    ["XP", c.xp.toLocaleString()],
                    ["Streak", `${c.streak}🔥`],
                    ["Sessions", String(c._count.sessions)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-zinc-800/60 py-2">
                      <div className="font-bold">{value}</div>
                      <div className="text-xs text-zinc-500">{label}</div>
                    </div>
                  ))}
                </div>

                {bestTiers.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {bestTiers.map((s) => (
                      <span key={s.id} className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                        {s.skill.icon} {s.skill.name} {TIER_META[s.tier as Tier].icon}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mb-3 border-t border-zinc-800 pt-3">
                  <p className="mb-2 text-sm font-semibold text-zinc-300">Fitness &amp; Freshness</p>
                  <FitnessChart series={seriesByChild.get(c.id) ?? []} />
                </div>

                <div className="space-y-2 border-t border-zinc-800 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-300">Coach invite code</span>
                    <div className="flex items-center gap-2">
                      {c.inviteCodes[0] && (
                        <code className="rounded-lg bg-zinc-800 px-2.5 py-1 font-mono text-sm text-emerald-400">
                          {c.inviteCodes[0].code}
                        </code>
                      )}
                      <form action={generateInviteCode.bind(null, c.id)}>
                        <button className="btn-secondary !px-2.5 !py-1 text-xs">
                          {c.inviteCodes[0] ? "New code" : "Generate code"}
                        </button>
                      </form>
                    </div>
                  </div>
                  {c.coachLinks.length > 0 && (
                    <div className="space-y-1">
                      {c.coachLinks.map((link) => (
                        <div key={link.id} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-300">🧑‍🏫 Coach {link.coach.name}</span>
                          <form action={removeCoach.bind(null, link.id)}>
                            <button className="text-xs text-red-400 hover:underline">Remove</button>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="card">
            <h2 className="mb-1 text-lg font-bold">Add a player</h2>
            <p className="mb-4 text-sm text-zinc-400">They&apos;ll log in with a username and 4-digit PIN.</p>
            <ActionForm action={addChild}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Name</label>
                    <input name="name" className="input" placeholder="Jordan" required />
                  </div>
                  <div>
                    <label className="label">Birth year</label>
                    <select name="birthYear" className="input" defaultValue={thisYear - 11}>
                      {Array.from({ length: 14 }, (_, i) => thisYear - 5 - i).map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} (age {thisYear - yr})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Username</label>
                    <input name="username" className="input" placeholder="superstriker10" required autoCapitalize="none" />
                  </div>
                  <div>
                    <label className="label">4-digit PIN</label>
                    <input name="pin" inputMode="numeric" pattern="\d{4}" maxLength={4} className="input" placeholder="1234" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Avatar</label>
                    <select name="avatar" className="input">
                      {["⚽", "🦁", "🚀", "🔥", "⭐", "🐆", "🦅", "👟"].map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Goal</label>
                    <select name="goal" className="input">
                      <option value="HAVE_FUN">Have fun &amp; improve</option>
                      <option value="MAKE_TEAM">Make a competitive team</option>
                      <option value="ELITE">Elite academy level</option>
                      <option value="PRO">Go professional</option>
                    </select>
                  </div>
                </div>
                <SubmitButton>Add player</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      </main>
    </div>
  );
}
