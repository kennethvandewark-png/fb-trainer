import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireChild } from "@/lib/auth";
import { ChildNav } from "@/components/nav";

export default async function DrillsPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const child = await requireChild();
  if (!child) redirect("/login/child");
  const { skill: skillFilter } = await searchParams;

  const skills = await prisma.skill.findMany({ orderBy: { name: "asc" }, include: { drills: { orderBy: { difficulty: "asc" } } } });
  const shown = skillFilter ? skills.filter((s) => s.id === skillFilter) : skills;

  return (
    <div>
      <ChildNav name={child.name} avatar={child.avatar} />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-2xl font-black">Drill library</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Every drill teaches you how to do it, step by step. Difficulty matches your progression levels.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/drills"
            className={`rounded-xl border px-3 py-1.5 text-sm ${!skillFilter ? "border-emerald-500 bg-emerald-950/50 text-emerald-300" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}
          >
            All
          </Link>
          {skills.map((s) => (
            <Link
              key={s.id}
              href={`/drills?skill=${s.id}`}
              className={`rounded-xl border px-3 py-1.5 text-sm ${skillFilter === s.id ? "border-emerald-500 bg-emerald-950/50 text-emerald-300" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}
            >
              {s.icon} {s.name}
            </Link>
          ))}
        </div>

        {shown.map((skill) => (
          <section key={skill.id}>
            <h2 className="mb-3 text-lg font-bold">
              {skill.icon} {skill.name}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {skill.drills.map((d) => (
                <Link key={d.id} href={`/drills/${d.id}`} className="card !p-4 transition hover:border-emerald-600">
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      Difficulty <span className="font-bold text-sky-400">{d.difficulty.toFixed(1)}</span>
                    </span>
                    <span>{d.durationMin} min · load {d.loadScore}</span>
                  </div>
                  <h3 className="font-bold">{d.name}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{d.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
