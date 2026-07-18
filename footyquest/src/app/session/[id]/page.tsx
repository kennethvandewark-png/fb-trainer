import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireChild } from "@/lib/auth";
import { completeSessionAction } from "@/lib/actions";
import { ChildNav } from "@/components/nav";
import { StatusPill } from "@/components/stats";
import { ActionForm, SubmitButton } from "@/components/ui";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const child = await requireChild();
  if (!child) redirect("/login/child");
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      drills: { include: { drill: { include: { skill: true } } }, orderBy: { order: "asc" } },
      feedbacks: { include: { coach: true } },
      assignedBy: true,
      plan: true,
    },
  });
  if (!session || session.childId !== child.id) notFound();

  const totalMin = session.drills.reduce((s, d) => s + d.drill.durationMin, 0);
  const isPlanned = session.status === "PLANNED";

  return (
    <div>
      <ChildNav name={child.name} avatar={child.avatar} />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <Link href="/calendar" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to calendar
        </Link>

        <div className="card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-black">{session.title}</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {session.date} · ~{totalMin} min · planned load {session.plannedLoad}
                {session.plan && <> · from plan &quot;{session.plan.name}&quot;</>}
                {session.assignedBy && <> · assigned by Coach {session.assignedBy.name}</>}
              </p>
            </div>
            <StatusPill status={session.status} />
          </div>
          {!isPlanned && (
            <div className="mt-3 rounded-xl bg-zinc-800/60 p-3 text-sm text-zinc-300">
              Logged{session.completedAt ? ` on ${session.completedAt.toISOString().slice(0, 10)}` : ""} — actual load{" "}
              <span className="font-bold text-emerald-400">{session.actualLoad}</span>
              {session.rpe ? (
                <> · RPE {session.rpe}/10</>
              ) : (
                session.effort && <> · felt {session.effort.replace("_", " ").toLowerCase()}</>
              )}
              {session.notes && <p className="mt-1 text-zinc-400">Notes: {session.notes}</p>}
            </div>
          )}
        </div>

        <ActionForm action={completeSessionAction}>
          <input type="hidden" name="sessionId" value={session.id} />
          <div className="space-y-4">
            {session.drills.map((sd, i) => (
              <div key={sd.id} className="card">
                <input type="hidden" name="sessionDrillIds" value={sd.id} />
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Drill {i + 1} · {sd.drill.skill.icon} {sd.drill.skill.name} · difficulty{" "}
                      <span className="text-sky-400">{sd.drill.difficulty.toFixed(1)}</span> · {sd.drill.durationMin} min
                    </div>
                    <h2 className="text-lg font-bold">{sd.drill.name}</h2>
                    <p className="text-sm text-zinc-400">{sd.drill.description}</p>
                  </div>
                </div>

                <details className="group mb-3 rounded-xl border border-zinc-700 bg-zinc-800/40" open={isPlanned && i === 0}>
                  <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-emerald-400">
                    📖 How to do it
                  </summary>
                  <div className="space-y-3 px-3 pb-3">
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase text-zinc-500">Steps</p>
                      <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-300">
                        {sd.drill.instructions.split("\n").map((s, j) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-bold uppercase text-zinc-500">Coaching points</p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
                        {sd.drill.coachingPoints.split("\n").map((s, j) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-xs text-zinc-500">Equipment: {sd.drill.equipment}</p>
                  </div>
                </details>

                {isPlanned ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-2 font-medium">
                      <input
                        type="checkbox"
                        name={`done_${sd.id}`}
                        defaultChecked
                        className="h-5 w-5 accent-emerald-500"
                      />
                      Completed
                    </label>
                    {sd.drill.targetMetric && (
                      <label className="flex items-center gap-2 text-sm text-zinc-300">
                        Result ({sd.drill.targetMetric}):
                        <input
                          type="number"
                          step="any"
                          min="0"
                          name={`result_${sd.id}`}
                          className="input !w-28 !py-1.5"
                          placeholder="—"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="text-sm">
                    {sd.completed ? (
                      <span className="text-emerald-400">
                        ✓ Completed
                        {sd.resultValue !== null && sd.drill.targetMetric && (
                          <> — {sd.resultValue} {sd.drill.targetMetric}</>
                        )}
                      </span>
                    ) : (
                      <span className="text-zinc-500">✗ Not completed</span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isPlanned && (
              <div className="card space-y-4">
                <div>
                  <label className="label">How hard was it? (rate 1–10)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <label key={n} className="cursor-pointer">
                        <input type="radio" name="rpe" value={n} defaultChecked={n === 5} className="peer sr-only" />
                        <span className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-700 text-sm font-semibold peer-checked:border-emerald-500 peer-checked:bg-emerald-950/60 peer-checked:text-emerald-300">
                          {n}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-zinc-500">
                    <span>1 · 😎 very easy</span>
                    <span>🥵 all-out · 10</span>
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">
                    Rate the whole session honestly — it tunes your progression levels and your Fitness &amp; Freshness chart.
                  </p>
                </div>
                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea name="notes" rows={2} className="input" placeholder="What went well? What was tricky?" />
                </div>
                <SubmitButton>Log session 🎉</SubmitButton>
              </div>
            )}
          </div>
        </ActionForm>

        {session.feedbacks.length > 0 && (
          <div className="card">
            <h2 className="mb-3 text-lg font-bold">Coach feedback</h2>
            <div className="space-y-2">
              {session.feedbacks.map((f) => (
                <div key={f.id} className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
                  <p className="text-sm">{f.message}</p>
                  <p className="mt-1 text-xs text-zinc-500">— Coach {f.coach.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
