# FootyQuest ⚽

A gamified web app that helps young players (10+) track and develop their soccer skills — inspired by the structured-training approach of TrainerRoad and TrainingPeaks, applied to youth soccer.

## Features

- **Structured training calendar** — planned vs. completed sessions, monthly load and compliance tracking.
- **AI training plans** — personalized multi-week plans via the OpenAI API, with an evidence-based rules engine as automatic fallback (progressive overload, ~8% weekly load ramp, recovery week every 4th week, age-appropriate session sizes).
- **Progression Levels** — every skill tracked 1.0–10.0, TrainerRoad-style; completing harder drills raises the level, and post-session effort surveys tune the adjustments.
- **Skill tiers** — Bronze → Silver → Gold → Elite benchmarks, age-adjusted (e.g. juggling counts, timed cone slaloms, 5-10-5 shuttle).
- **Gamification** — XP and player levels, streaks with earned streak freezes (gentle, not punitive), 15 badges.
- **Drill library that teaches** — 23 drills across 8 skills with step-by-step instructions, coaching points, equipment, difficulty and load scores.
- **Family accounts** — parents own the account and add child profiles; children log in with a username + 4-digit PIN (no child emails, COPPA-friendly).
- **Coach role** — coaches link to players via parent-generated invite codes, assign sessions, and leave feedback; parents can remove a coach at any time.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, server actions) + TypeScript + Tailwind CSS
- [Prisma](https://prisma.io) ORM with SQLite (swap `DATABASE_URL` for Postgres in production if desired)
- Session auth with signed JWT cookies (`jose`) and bcrypt-hashed passwords/PINs
- [OpenAI API](https://platform.openai.com) (optional) for AI plan generation

## Getting started

```bash
npm install
cp .env.example .env        # then edit AUTH_SECRET (and optionally OPENAI_API_KEY)
npx prisma migrate dev      # creates the SQLite db and seeds skills/drills/badges
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Try it out

1. Register a **parent** account, add a child (username + PIN).
2. Log out, then use **Player login** with the child's username/PIN.
3. Generate a training plan (Calendar → New plan) — sessions appear on the calendar.
4. Open today's/any session, follow the drill instructions, log results and effort.
5. Watch XP, streaks, progression levels, tiers and badges update.
6. Register a **coach** account, link the child using an invite code from the parent dashboard, assign sessions and leave feedback.

## Deployment

The app deploys anywhere Next.js runs. Recommended free-tier options:

- **[Railway](https://railway.app) / [Fly.io](https://fly.io)** — simplest with SQLite: deploy the app with a persistent volume mounted where `DATABASE_URL` points, run `npx prisma migrate deploy && npx prisma db seed` once.
- **[Vercel](https://vercel.com)** — serverless filesystems are ephemeral, so switch `DATABASE_URL` to a hosted Postgres (Neon/Supabase free tier) and change the `provider` in `prisma/schema.prisma` to `postgresql`.

Set `AUTH_SECRET` (long random string) and optionally `OPENAI_API_KEY` in the host's environment settings.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run seed` | Re-seed skills, drills and badges (idempotent) |
