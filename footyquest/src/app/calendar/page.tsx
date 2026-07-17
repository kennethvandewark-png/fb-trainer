import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireChild } from "@/lib/auth";
import { todayStr } from "@/lib/gamification";
import { ChildNav } from "@/components/nav";
import { STATUS_META } from "@/components/stats";

function monthLabel(ym: string) {
  return new Date(ym + "-01T00:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; created?: string }>;
}) {
  const child = await requireChild();
  if (!child) redirect("/login/child");

  const params = await searchParams;
  const today = todayStr();
  const ym = params.month ?? today.slice(0, 7);
  const [y, m] = ym.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0=Sun

  const sessions = await prisma.session.findMany({
    where: { childId: child.id, date: { gte: `${ym}-01`, lte: `${ym}-${String(daysInMonth).padStart(2, "0")}` } },
    orderBy: { date: "asc" },
  });
  const byDay = new Map<string, typeof sessions>();
  for (const s of sessions) {
    if (!byDay.has(s.date)) byDay.set(s.date, []);
    byDay.get(s.date)!.push(s);
  }

  const plan = await prisma.trainingPlan.findFirst({ where: { childId: child.id, active: true } });
  const monthPlanned = sessions.reduce((sum, s) => sum + s.plannedLoad, 0);
  const monthActual = sessions.reduce((sum, s) => sum + s.actualLoad, 0);
  const done = sessions.filter((s) => s.status === "COMPLETED" || s.status === "PARTIAL").length;
  const past = sessions.filter((s) => s.date <= today).length;
  const compliance = past > 0 ? Math.round((done / past) * 100) : null;

  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`),
  ];

  return (
    <div>
      <ChildNav name={child.name} avatar={child.avatar} />
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        {params.created && (
          <div className="rounded-xl border border-emerald-800 bg-emerald-950/60 px-4 py-3 text-emerald-300">
            🎉 Your new training plan is on the calendar! Sessions start tomorrow at the earliest.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black">{monthLabel(ym)}</h1>
          <div className="flex items-center gap-2">
            <Link href={`/calendar?month=${shiftMonth(ym, -1)}`} className="btn-secondary !px-3 !py-1.5 text-sm">
              ← Prev
            </Link>
            <Link href={`/calendar?month=${today.slice(0, 7)}`} className="btn-secondary !px-3 !py-1.5 text-sm">
              Today
            </Link>
            <Link href={`/calendar?month=${shiftMonth(ym, 1)}`} className="btn-secondary !px-3 !py-1.5 text-sm">
              Next →
            </Link>
            <Link href="/plan/new" className="btn-primary !px-3 !py-1.5 text-sm">
              🤖 New plan
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-400">
          {plan && (
            <span>
              Active plan: <span className="text-zinc-200">{plan.name}</span>{" "}
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">{plan.source}</span>
            </span>
          )}
          <span>
            Month load: <span className="text-emerald-400">{monthActual}</span> / {monthPlanned} planned
          </span>
          {compliance !== null && (
            <span>
              Compliance: <span className="text-emerald-400">{compliance}%</span>
            </span>
          )}
        </div>

        <div className="card !p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => (
              <div
                key={i}
                className={`min-h-20 rounded-lg border p-1 sm:min-h-24 ${
                  date === today
                    ? "border-emerald-600 bg-emerald-950/30"
                    : date
                      ? "border-zinc-800 bg-zinc-900/40"
                      : "border-transparent"
                }`}
              >
                {date && (
                  <>
                    <div className={`px-1 text-xs ${date === today ? "font-bold text-emerald-400" : "text-zinc-500"}`}>
                      {Number(date.slice(8))}
                    </div>
                    <div className="mt-0.5 space-y-0.5">
                      {(byDay.get(date) ?? []).map((s) => {
                        const meta = STATUS_META[s.status];
                        return (
                          <Link
                            key={s.id}
                            href={`/session/${s.id}`}
                            className={`block truncate rounded border px-1 py-0.5 text-[10px] leading-tight hover:brightness-125 sm:text-xs ${meta.cls} bg-zinc-800/70`}
                            title={`${s.title} — ${meta.label}`}
                          >
                            <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {s.title}
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
          {Object.entries(STATUS_META).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${v.dot}`} /> {v.label}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
