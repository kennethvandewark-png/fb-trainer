import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/nav";

const features = [
  {
    icon: "📅",
    title: "Structured Training Calendar",
    text: "Planned vs. completed sessions on a TrainingPeaks-style calendar, with weekly load that ramps safely.",
  },
  {
    icon: "🤖",
    title: "AI Training Plans",
    text: "Personalized multi-week plans built from your age, skill levels and goals — following youth training science.",
  },
  {
    icon: "📈",
    title: "Progression Levels",
    text: "Every skill tracked 1.0–10.0, TrainerRoad-style. Complete harder drills, watch your levels climb.",
  },
  {
    icon: "🏅",
    title: "Badges, Streaks & XP",
    text: "Earn XP every session, keep streaks alive with streak freezes, and chase Bronze → Elite skill tiers.",
  },
  {
    icon: "🎓",
    title: "Drills That Teach",
    text: "Every drill comes with step-by-step instructions and pro coaching points — learn it, then train it.",
  },
  {
    icon: "🧑‍🏫",
    title: "Coach Connected",
    text: "Coaches link with an invite code, assign sessions, and leave feedback right on the calendar.",
  },
];

export default async function Landing() {
  const session = await getSession();
  if (session?.kind === "child") redirect("/home");
  if (session?.kind === "user") redirect(session.role === "PARENT" ? "/parent" : "/coach");

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/login/child" className="btn-secondary !py-2 text-sm">
            Player login
          </Link>
          <Link href="/login" className="btn-secondary !py-2 text-sm">
            Parent / Coach login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-16 text-center sm:py-24">
          <p className="mb-4 inline-block rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1 text-sm text-emerald-300">
            Structured training meets gamification
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Level up your soccer skills, <span className="text-emerald-400">one session at a time</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
            FootyQuest gives young players a personal training plan, progression levels for every skill,
            and the streaks, XP and badges that make practice addictive.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary !px-6 !py-3 text-base">
              Create a family account
            </Link>
            <Link href="/register?role=coach" className="btn-secondary !px-6 !py-3 text-base">
              I&apos;m a coach
            </Link>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-zinc-800 text-2xl">{f.icon}</div>
              <h3 className="mb-1 font-bold">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
        FootyQuest — built for the next generation of players.
      </footer>
    </div>
  );
}
