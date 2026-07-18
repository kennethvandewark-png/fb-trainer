import { addDays, daysBetween, todayStr } from "./gamification";

/**
 * Evidence-based training-load model (Banister impulse-response, EWMA form).
 *
 * Daily load is session-RPE load (RPE 1-10 × minutes trained). Two exponentially
 * weighted moving averages track the athlete's rolling load:
 *   - Fitness  (chronic load, "CTL") — long time constant, slow to rise/fall.
 *   - Tiredness (acute load, "ATL")  — short time constant, reacts fast.
 *   - Freshness (form, "TSB")        — Fitness − Tiredness.
 *
 * These are relative training-consistency trends, NOT measured fitness/fatigue
 * and NOT an injury-risk predictor. The 42/7-day constants are heuristic values
 * from the endurance literature; they are not validated for youth soccer.
 */

export const FITNESS_TAU = 42; // days (chronic load / "CTL")
export const FATIGUE_TAU = 7; // days (acute load / "ATL")

/**
 * Extra history (in days) to load *before* the display window so the EWMAs are
 * warmed up on real training instead of restarting from zero at the window edge.
 * Four chronic time constants leaves the zero seed at e^-4 (~1.8%) influence by
 * the time the display window starts, which is close enough to steady state.
 */
export const FITNESS_WARMUP_DAYS = FITNESS_TAU * 4; // 168 days

/** EWMA smoothing factor for a given time constant (τ) in days. */
export function ewmaAlpha(tau: number) {
  return 1 - Math.exp(-1 / tau);
}

export type FitnessPoint = {
  date: string; // yyyy-mm-dd
  load: number; // that day's total training load
  fitness: number; // chronic load (CTL)
  fatigue: number; // acute load (ATL)
  freshness: number; // form (TSB) = fitness - fatigue
};

type SessionLike = { date: string; trainingLoad: number };

/**
 * Build a daily Fitness/Tiredness/Freshness series from completed sessions.
 * EWMAs are seeded at 0 and advanced one calendar day at a time (rest days = 0
 * load), so the curves reflect gaps in training the way a PMC does.
 *
 * @param days how many trailing days to return (the series is computed from the
 *             first session so the averages are warmed up before this window).
 */
export function buildFitnessSeries(sessions: SessionLike[], days = 84): FitnessPoint[] {
  const today = todayStr();

  const loadByDate = new Map<string, number>();
  for (const s of sessions) {
    if (!s.trainingLoad) continue;
    loadByDate.set(s.date, (loadByDate.get(s.date) ?? 0) + s.trainingLoad);
  }

  // Start warming up the averages from the first ever session (or the display
  // window if there is no earlier data), whichever is earlier.
  const windowStart = addDays(today, -(days - 1));
  const firstSession = [...loadByDate.keys()].sort()[0];
  const start = firstSession && firstSession < windowStart ? firstSession : windowStart;

  const aF = ewmaAlpha(FITNESS_TAU);
  const aA = ewmaAlpha(FATIGUE_TAU);

  const series: FitnessPoint[] = [];
  let fitness = 0;
  let fatigue = 0;

  const total = daysBetween(start, today);
  for (let i = 0; i <= total; i++) {
    const date = addDays(start, i);
    const load = loadByDate.get(date) ?? 0;
    fitness = fitness + aF * (load - fitness);
    fatigue = fatigue + aA * (load - fatigue);
    if (date >= windowStart) {
      series.push({
        date,
        load,
        fitness: Math.round(fitness * 10) / 10,
        fatigue: Math.round(fatigue * 10) / 10,
        freshness: Math.round((fitness - fatigue) * 10) / 10,
      });
    }
  }

  return series;
}

/**
 * Earliest session date `buildFitnessSeries` needs in order to warm up the EWMAs
 * before the `days`-long display window. Callers must fetch sessions from this
 * date (inclusive) up to today; otherwise the chronic/acute averages restart
 * from zero at the window edge and understate Fitness/Tiredness for athletes who
 * were already training before the window.
 */
export function fitnessLoadStartDate(days = 84, today = todayStr()): string {
  return addDays(today, -(days - 1 + FITNESS_WARMUP_DAYS));
}

/** Plain-language reading of the current freshness value. */
export function freshnessLabel(freshness: number): { label: string; hint: string } {
  if (freshness > 5) return { label: "Fresh", hint: "Well recovered — great day to test or play." };
  if (freshness >= -10) return { label: "Balanced", hint: "Training and recovery are in a good balance." };
  if (freshness >= -25) return { label: "Building", hint: "Carrying some tiredness from recent training." };
  return { label: "Tired", hint: "Heavy recent load — make sure to get some easy days." };
}
