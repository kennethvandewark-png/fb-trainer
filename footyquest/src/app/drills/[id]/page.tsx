import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireChild } from "@/lib/auth";
import { ChildNav } from "@/components/nav";

export default async function DrillPage({ params }: { params: Promise<{ id: string }> }) {
  const child = await requireChild();
  if (!child) redirect("/login/child");
  const { id } = await params;

  const drill = await prisma.drill.findUnique({ where: { id }, include: { skill: true } });
  if (!drill) notFound();

  return (
    <div>
      <ChildNav name={child.name} avatar={child.avatar} />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <Link href={`/drills?skill=${drill.skillId}`} className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to {drill.skill.name} drills
        </Link>

        <div className="card">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {drill.skill.icon} {drill.skill.name} · difficulty{" "}
            <span className="text-sky-400">{drill.difficulty.toFixed(1)}</span> · {drill.durationMin} min · load{" "}
            {drill.loadScore}
          </div>
          <h1 className="text-2xl font-black">{drill.name}</h1>
          <p className="mt-2 text-zinc-300">{drill.description}</p>
          <p className="mt-2 text-sm text-zinc-500">🎒 Equipment: {drill.equipment}</p>
          {drill.targetMetric && (
            <p className="mt-1 text-sm text-emerald-400">📊 Logs a benchmark result: {drill.targetMetric}</p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-bold">📖 Step by step</h2>
          <ol className="list-decimal space-y-2 pl-5 text-zinc-300">
            {drill.instructions.split("\n").map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-bold">🎯 Coaching points</h2>
          <ul className="list-disc space-y-2 pl-5 text-zinc-300">
            {drill.coachingPoints.split("\n").map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
