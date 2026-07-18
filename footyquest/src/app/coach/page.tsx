import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { linkAthlete } from "@/lib/actions";
import { UserNav } from "@/components/nav";
import { ActionForm, SubmitButton } from "@/components/ui";
import { levelFromXp, todayStr } from "@/lib/gamification";
import { ageFromBirthYear } from "@/lib/benchmarks";

export default async function CoachPage() {
  const coach = await requireUser("COACH");
  if (!coach) redirect("/login");

  const links = await prisma.coachLink.findMany({
    where: { coachId: coach.id },
    include: {
      child: {
        include: {
          _count: { select: { sessions: { where: { status: { in: ["COMPLETED", "PARTIAL"] } } } } },
          sessions: { where: { date: { gte: todayStr() }, status: "PLANNED" }, orderBy: { date: "asc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <UserNav name={coach.name} role="COACH" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-black">Coach dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Link players with the invite code their parent generated, then assign sessions and leave feedback.
          </p>
        </div>

        <div className="card max-w-md">
          <h2 className="mb-3 text-lg font-bold">Link a new player</h2>
          <ActionForm action={linkAthlete}>
            <div className="flex gap-2">
              <input name="code" className="input font-mono uppercase" placeholder="Invite code, e.g. 4XK2ZQ" required />
              <SubmitButton className="btn-primary whitespace-nowrap">Link player</SubmitButton>
            </div>
          </ActionForm>
        </div>

        {links.length === 0 ? (
          <p className="text-zinc-400">No players linked yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {links.map(({ child }) => (
              <Link key={child.id} href={`/coach/athlete/${child.id}`} className="card transition hover:border-emerald-600">
                <div className="mb-2 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-zinc-800 text-xl">{child.avatar}</span>
                  <div>
                    <h3 className="font-bold leading-tight">{child.name}</h3>
                    <p className="text-sm text-zinc-400">age {ageFromBirthYear(child.birthYear)}</p>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">
                  Level {levelFromXp(child.xp)} · {child.streak}🔥 streak · {child._count.sessions} sessions
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  {child.sessions[0] ? `Next: ${child.sessions[0].title} on ${child.sessions[0].date}` : "No upcoming sessions"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
