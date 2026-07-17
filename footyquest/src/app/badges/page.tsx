import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireChild } from "@/lib/auth";
import { ChildNav } from "@/components/nav";

export default async function BadgesPage() {
  const child = await requireChild();
  if (!child) redirect("/login/child");

  const [badges, owned] = await Promise.all([
    prisma.badge.findMany(),
    prisma.childBadge.findMany({ where: { childId: child.id } }),
  ]);
  const ownedMap = new Map(owned.map((b) => [b.badgeId, b]));

  return (
    <div>
      <ChildNav name={child.name} avatar={child.avatar} />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-2xl font-black">Badges</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {owned.length} of {badges.length} earned. Keep training to unlock them all!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b) => {
            const earned = ownedMap.get(b.id);
            return (
              <div
                key={b.id}
                className={`card !p-4 text-center ${earned ? "border-emerald-700 bg-emerald-950/30" : "opacity-50 grayscale"}`}
              >
                <div className="text-4xl">{b.icon}</div>
                <h3 className="mt-2 font-bold">{b.name}</h3>
                <p className="mt-1 text-xs text-zinc-400">{b.description}</p>
                {earned && (
                  <p className="mt-2 text-xs text-emerald-400">
                    Earned {earned.earnedAt.toISOString().slice(0, 10)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
