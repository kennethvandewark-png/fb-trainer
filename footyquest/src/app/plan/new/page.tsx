import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireChild } from "@/lib/auth";
import { generatePlanAction } from "@/lib/actions";
import { ChildNav } from "@/components/nav";
import { ActionForm, SubmitButton } from "@/components/ui";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

const GOALS = [
  { value: "HAVE_FUN", label: "🎉 Have fun & improve" },
  { value: "MAKE_TEAM", label: "🏅 Make a competitive team" },
  { value: "ELITE", label: "🌟 Reach elite academy level" },
  { value: "PRO", label: "🚀 Work toward going pro" },
];

export default async function NewPlanPage() {
  const child = await requireChild();
  if (!child) redirect("/login/child");

  const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
  const aiEnabled = Boolean(process.env.OPENAI_API_KEY);

  return (
    <div>
      <ChildNav name={child.name} avatar={child.avatar} />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6">
        <Link href="/calendar" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to calendar
        </Link>

        <div className="card">
          <h1 className="text-2xl font-black">🤖 Build your training plan</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {aiEnabled
              ? "The AI coach designs a progressive plan from your skill levels and goals, following youth training science."
              : "The smart plan builder designs a progressive plan from your skill levels and goals, following youth training science."}{" "}
            Creating a new plan replaces your current active plan.
          </p>
        </div>

        <ActionForm action={generatePlanAction} className="card">
          <div className="space-y-6">
            <div>
              <label className="label">What&apos;s your big goal?</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <label key={g.value} className="cursor-pointer">
                    <input type="radio" name="goal" value={g.value} defaultChecked={g.value === child.goal} className="peer sr-only" />
                    <span className="block rounded-xl border border-zinc-700 px-3 py-2.5 text-sm peer-checked:border-emerald-500 peer-checked:bg-emerald-950/50 peer-checked:text-emerald-300">
                      {g.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Plan length</label>
              <div className="flex flex-wrap gap-2">
                {[4, 6, 8, 12].map((w) => (
                  <label key={w} className="cursor-pointer">
                    <input type="radio" name="weeks" value={w} defaultChecked={w === 4} className="peer sr-only" />
                    <span className="inline-block rounded-xl border border-zinc-700 px-4 py-2 text-sm peer-checked:border-emerald-500 peer-checked:bg-emerald-950/50 peer-checked:text-emerald-300">
                      {w} weeks
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Which days can you train?</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <label key={d.value} className="cursor-pointer">
                    <input
                      type="checkbox"
                      name="weekdays"
                      value={d.value}
                      defaultChecked={[1, 3, 5].includes(d.value)}
                      className="peer sr-only"
                    />
                    <span className="inline-block rounded-xl border border-zinc-700 px-3.5 py-2 text-sm peer-checked:border-emerald-500 peer-checked:bg-emerald-950/50 peer-checked:text-emerald-300">
                      {d.label}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">
                3-4 days is the sweet spot for most players. Keep at least one full rest day.
              </p>
            </div>

            <div>
              <label className="label">Skills you want to prioritize (optional)</label>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <label key={s.id} className="cursor-pointer">
                    <input type="checkbox" name="focusSkills" value={s.id} className="peer sr-only" />
                    <span className="inline-block rounded-xl border border-zinc-700 px-3 py-1.5 text-sm peer-checked:border-sky-500 peer-checked:bg-sky-950/50 peer-checked:text-sky-300">
                      {s.icon} {s.name}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-zinc-500">Leave empty and we&apos;ll target your weakest skills.</p>
            </div>

            <SubmitButton>Generate my plan 🚀</SubmitButton>
          </div>
        </ActionForm>
      </main>
    </div>
  );
}
