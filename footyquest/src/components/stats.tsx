import { levelProgress } from "@/lib/gamification";
import { FitnessPoint, freshnessLabel } from "@/lib/trainingload";

export function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="card flex items-center gap-4 !p-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-zinc-800 text-xl">{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-xl font-bold leading-tight">{value}</div>
        <div className="text-xs text-zinc-400">{label}</div>
        {sub && <div className="text-xs text-emerald-400">{sub}</div>}
      </div>
    </div>
  );
}

export function XpBar({ xp }: { xp: number }) {
  const p = levelProgress(xp);
  const pct = Math.min(100, Math.round((p.current / p.needed) * 100));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-bold text-emerald-400">Level {p.level}</span>
        <span className="text-zinc-400">
          {p.current}/{p.needed} XP to level {p.nextLevel}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** TrainingPeaks-style weekly load bars: planned (outline) vs completed (filled). */
export function LoadChart({
  weeks,
}: {
  weeks: { label: string; planned: number; actual: number }[];
}) {
  const max = Math.max(1, ...weeks.map((w) => Math.max(w.planned, w.actual)));
  return (
    <div>
      <div className="flex h-36 items-end gap-3">
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end justify-center gap-1">
              <div
                className="w-1/3 rounded-t border border-zinc-600 bg-transparent"
                style={{ height: `${(w.planned / max) * 100}%` }}
                title={`Planned load: ${w.planned}`}
              />
              <div
                className="w-1/3 rounded-t bg-emerald-500"
                style={{ height: `${(w.actual / max) * 100}%` }}
                title={`Completed load: ${w.actual}`}
              />
            </div>
            <span className="text-[10px] text-zinc-500">{w.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-zinc-600" /> Planned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Completed
        </span>
      </div>
    </div>
  );
}

/**
 * Fitness / Tiredness / Freshness trend — an EWMA-based (Banister) view of
 * training-load consistency, in the spirit of a TrainingPeaks PMC. Kid-facing
 * labels by default; pass `technical` to also show the CTL/ATL/TSB names.
 */
export function FitnessChart({
  series,
  technical = false,
}: {
  series: FitnessPoint[];
  technical?: boolean;
}) {
  const hasData = series.some((p) => p.fitness > 0 || p.load > 0);
  if (!hasData) {
    return (
      <p className="text-sm text-zinc-400">
        Log a few sessions (with a 1–10 effort rating) to start building your Fitness &amp; Freshness trend.
      </p>
    );
  }

  const W = 320;
  const H = 150;
  const padX = 6;
  const padTop = 8;
  const padBottom = 8;

  const values = series.flatMap((p) => [p.fitness, p.fatigue, p.freshness]);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const n = series.length;

  const x = (i: number) => padX + (n === 1 ? 0 : (i / (n - 1)) * (W - padX * 2));
  const y = (v: number) => padTop + ((max - v) / span) * (H - padTop - padBottom);

  const line = (key: "fitness" | "fatigue" | "freshness") =>
    series.map((p, i) => `${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");

  const current = series[series.length - 1];
  const fresh = freshnessLabel(current.freshness);
  const zeroY = y(0);

  const metrics = [
    { key: "fitness" as const, kid: "Fitness", tech: "CTL", color: "#34d399", value: current.fitness },
    { key: "fatigue" as const, kid: "Tiredness", tech: "ATL", color: "#f59e0b", value: current.fatigue },
    { key: "freshness" as const, kid: "Freshness", tech: "TSB", color: "#38bdf8", value: current.freshness },
  ];

  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div key={m.key} className="rounded-xl bg-zinc-800/60 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
              {m.kid}
              {technical && <span className="text-zinc-500">({m.tech})</span>}
            </div>
            <div className="text-lg font-bold" style={{ color: m.color }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" preserveAspectRatio="none" role="img">
        {min < 0 && (
          <line x1={padX} y1={zeroY} x2={W - padX} y2={zeroY} stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="3 3" />
        )}
        {metrics.map((m) => (
          <polyline
            key={m.key}
            points={line(m.key)}
            fill="none"
            stroke={m.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          >
            <title>{`${m.kid}${technical ? ` (${m.tech})` : ""}: now ${m.value}`}</title>
          </polyline>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-zinc-400">
          {series[0].date} → {current.date}
        </span>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
          Today: <span className="font-semibold text-sky-300">{fresh.label}</span> — {fresh.hint}
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        A training-consistency trend from your session effort, not a medical measure of fitness or a
        readiness/injury score.
      </p>
    </div>
  );
}

export function ProgressionBar({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400"
          style={{ width: `${(level / 10) * 100}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-bold text-sky-400">{level.toFixed(1)}</span>
    </div>
  );
}

export const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  PLANNED: { label: "Planned", cls: "text-zinc-300 border-zinc-600", dot: "bg-zinc-500" },
  COMPLETED: { label: "Completed", cls: "text-emerald-300 border-emerald-700", dot: "bg-emerald-500" },
  PARTIAL: { label: "Partial", cls: "text-amber-300 border-amber-700", dot: "bg-amber-500" },
  SKIPPED: { label: "Skipped", cls: "text-red-300 border-red-800", dot: "bg-red-500" },
};

export function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.PLANNED;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} /> {m.label}
    </span>
  );
}
