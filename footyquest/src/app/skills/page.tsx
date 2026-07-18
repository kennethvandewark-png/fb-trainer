import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireChild } from "@/lib/auth";
import { recordBenchmark } from "@/lib/actions";
import { ChildNav } from "@/components/nav";
import { ProgressionBar } from "@/components/stats";
import { ActionForm, SubmitButton } from "@/components/ui";
import {
  Benchmarks,
  Tier,
  TIER_META,
  ageFromBirthYear,
  bandForAge,
  nextTarget,
} from "@/lib/benchmarks";

export default async function SkillsPage() {
  const child = await requireChild();
  if (!child) redirect("/login/child");
  const age = ageFromBirthYear(child.birthYear);

  const [skills, childSkills] = await Promise.all([
    prisma.skill.findMany({ orderBy: { name: "asc" } }),
    prisma.childSkill.findMany({ where: { childId: child.id } }),
  ]);
  const csMap = new Map(childSkills.map((cs) => [cs.skillId, cs]));

  return (
    <div>
      <ChildNav name={child.name} avatar={child.avatar} />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-2xl font-black">Your skills</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Progression levels (1.0–10.0) rise as you complete harder drills. Tiers are earned by hitting
            benchmark test results for your age group ({age} years).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {skills.map((skill) => {
            const cs = csMap.get(skill.id);
            const benchmarks = JSON.parse(skill.benchmarks) as Benchmarks;
            const band = bandForAge(benchmarks, age);
            const tier = (cs?.tier ?? "NONE") as Tier;
            const target = nextTarget(benchmarks, age, tier);
            const meta = TIER_META[tier];

            return (
              <div key={skill.id} className="card">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-800 text-xl">{skill.icon}</span>
                    <div>
                      <h2 className="font-bold leading-tight">{skill.name}</h2>
                      <span className={`text-sm ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mb-3 text-sm text-zinc-400">{skill.description}</p>

                <div className="mb-3">
                  <p className="mb-1 text-xs font-semibold uppercase text-zinc-500">Progression level</p>
                  <ProgressionBar level={cs?.progressionLevel ?? 1} />
                </div>

                <div className="mb-3 grid grid-cols-4 gap-1 text-center text-xs">
                  {(["bronze", "silver", "gold", "elite"] as const).map((t, ti) => {
                    const achieved =
                      tier !== "NONE" && ti <= ["BRONZE", "SILVER", "GOLD", "ELITE"].indexOf(tier);
                    return (
                      <div
                        key={t}
                        className={`rounded-lg border px-1 py-1.5 ${
                          achieved
                            ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
                            : "border-zinc-800 text-zinc-500"
                        }`}
                      >
                        <div>{TIER_META[t.toUpperCase() as Tier].icon}</div>
                        <div className="font-semibold">{band[t]}</div>
                      </div>
                    );
                  })}
                </div>
                <p className="mb-3 text-xs text-zinc-500">
                  Benchmark: {benchmarks.unit} ({benchmarks.direction === "higher" ? "higher" : "lower"} is better).{" "}
                  {cs?.bestResult != null && (
                    <>
                      Your best: <span className="font-bold text-zinc-300">{cs.bestResult}</span>.{" "}
                    </>
                  )}
                  {target && (
                    <>
                      Next: <span className="text-emerald-400">{TIER_META[target.tier].label} at {target.value}</span>
                    </>
                  )}
                </p>

                <ActionForm action={recordBenchmark}>
                  <input type="hidden" name="skillId" value={skill.id} />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      name="value"
                      className="input !py-1.5"
                      placeholder={`Log a test (${benchmarks.unit})`}
                      required
                    />
                    <SubmitButton className="btn-secondary !py-1.5 text-sm whitespace-nowrap">Save test</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
