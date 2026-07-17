export type BenchmarkBand = {
  minAge: number;
  maxAge: number;
  bronze: number;
  silver: number;
  gold: number;
  elite: number;
};

export type Benchmarks = {
  unit: string;
  direction: "higher" | "lower";
  bands: BenchmarkBand[];
};

export const TIERS = ["NONE", "BRONZE", "SILVER", "GOLD", "ELITE"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_META: Record<Tier, { label: string; icon: string; color: string }> = {
  NONE: { label: "Unranked", icon: "•", color: "text-zinc-400" },
  BRONZE: { label: "Bronze", icon: "🥉", color: "text-amber-600" },
  SILVER: { label: "Silver", icon: "🥈", color: "text-zinc-300" },
  GOLD: { label: "Gold", icon: "🥇", color: "text-yellow-400" },
  ELITE: { label: "Elite", icon: "🌟", color: "text-emerald-400" },
};

export function ageFromBirthYear(birthYear: number) {
  return new Date().getFullYear() - birthYear;
}

export function bandForAge(benchmarks: Benchmarks, age: number): BenchmarkBand {
  return (
    benchmarks.bands.find((b) => age >= b.minAge && age <= b.maxAge) ??
    benchmarks.bands[benchmarks.bands.length - 1]
  );
}

export function tierForResult(benchmarks: Benchmarks, age: number, value: number): Tier {
  const band = bandForAge(benchmarks, age);
  const better = (threshold: number) =>
    benchmarks.direction === "higher" ? value >= threshold : value <= threshold;
  if (better(band.elite)) return "ELITE";
  if (better(band.gold)) return "GOLD";
  if (better(band.silver)) return "SILVER";
  if (better(band.bronze)) return "BRONZE";
  return "NONE";
}

export function isBetterResult(direction: "higher" | "lower", a: number, b: number) {
  return direction === "higher" ? a > b : a < b;
}

/** Next tier the child is chasing, plus the threshold value. */
export function nextTarget(benchmarks: Benchmarks, age: number, tier: Tier) {
  const band = bandForAge(benchmarks, age);
  const order: { tier: Tier; value: number }[] = [
    { tier: "BRONZE", value: band.bronze },
    { tier: "SILVER", value: band.silver },
    { tier: "GOLD", value: band.gold },
    { tier: "ELITE", value: band.elite },
  ];
  const idx = TIERS.indexOf(tier);
  return order.find((o) => TIERS.indexOf(o.tier) > idx) ?? null;
}
