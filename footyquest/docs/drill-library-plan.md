# Drill Library Plan — a TrainerRoad-style bank of soccer drills

Status: proposal / planning document
Scope: research findings + design for a large, skill-adaptive drill bank with video explanations

---

## 1. Goal

Replace the current 23-drill seed with a large, structured drill bank that works like
TrainerRoad's workout library:

- **Every drill has an objective difficulty level (1.0–10.0) within its skill**, the same
  scale as the child's per-skill `progressionLevel` that already exists in `ChildSkill`.
- **Drills come in progression families** (like TrainerRoad's workout progressions), so the
  plan generator can move an athlete up or down a ladder instead of picking from a flat list.
- **Every drill is adaptable**: each variant carries explicit "make it easier / make it
  harder" scaling knobs, so a single drill spans a range of abilities.
- **Every drill has a video explanation** sourced from freely available content
  (YouTube embeds from established free coaching channels).

Benchmark for scale: Techne Futbol ships ~1,000 drills with a demo video and level up/down
option per drill; TrainerRoad's library has thousands of workouts ranked 1–10 per training
zone. Our target: **~320 drill variants (from ~80 families) at launch, growing to 600+**.

---

## 2. Research summary

### 2.1 How TrainerRoad structures its library (the model to copy)

Sources: [Workout Levels](https://support.trainerroad.com/hc/en-us/articles/360061003592-Workout-Levels),
[Progression Levels](https://www.trainerroad.com/blog/progression-levels-what-they-are-and-how-to-use-them/),
[Adaptive Training](https://www.trainerroad.com/blog/how-to-use-adaptive-training/).

- **Workout Levels (1–10, per zone)**: every workout is objectively ranked *within its
  training zone*. A level 6 threshold workout is harder than a level 3 threshold workout,
  but levels are not comparable across zones. → For us: `Drill.difficulty` is 1–10 *within
  its skill* (a 6.0 juggling drill vs a 6.0 shooting drill are independent scales).
- **Progression Levels (1–10, per athlete per zone)**: a dynamic measure of what the athlete
  can currently do in each zone. Completing a harder workout raises it; struggling or
  inactivity decays it. → We already have `ChildSkill.progressionLevel`; we need the update
  and decay rules (§6).
- **Difficulty Labels**: comparing workout level vs athlete level yields *Achievable /
  Productive / Stretch / Breakthrough*. → We should surface the same four labels on drill
  cards so kids/parents instantly see how hard a drill is *for them*.
- **Progressions**: workouts are organized in named ladders (same workout concept at
  increasing levels) so plans can step up ~one notch per week. → Our **drill families**.

### 2.2 Youth soccer training methodology (what the content must respect)

Sources: [US Youth Soccer Player Development Model](https://www.usyouthsoccer.org/wp-content/uploads/sites/160/2023/09/Player-Development-Model-Oct-2013.pdf),
[AYSO coaching manuals](https://www.ayso13.org/assets/docs/10u-coach.pdf),
[Canada Soccer Pathway toolkits](https://canadasoccer.com/wp-content/uploads/2026/02/CanadaSoccerPathway_CoachsToolKit_ActiveStart_EN.pdf).

- **Simple → complex, unopposed → opposed.** The canonical progression axis: technique with
  no pressure → technique at speed / with decisions → technique under passive pressure →
  match-like pressure. Since FootyQuest is primarily solo/backyard training, our ladder tops
  out at "at speed, under time pressure, with combined moves" rather than full opposition,
  plus optional partner/parent-pressure variants.
- **Scaling knobs coaches actually use**: space (bigger = easier), speed/tempo, number of
  touches allowed, ball type/size, distance, target size, dominant vs weak foot, time
  pressure. These become the structured `scaling` field on every drill (§4.3).
- **Age stages matter separately from skill level.** U6–U8 = ball familiarity and fun;
  U9–U12 = "golden age" of technique acquisition; U13+ = speed, refinement, physical work.
  Bodyweight-only physical drills before puberty; sprint/plyo loads only age-appropriate.
  → Keep `difficulty` skill-based, and add an `ageMin`/`ageMax` gate per drill variant.
- **Little and often beats long and rare** for solo technical work: 15–45 min sessions,
  high repetition, measurable outcomes. Matches our existing 2–3 drills/session design.

### 2.3 Comparable products (sizing and feature benchmarks)

- **Techne Futbol** ([training experience](https://www.technefutbol.com/training-experience)):
  ~1,000 drills; categories technical / physical / mental / recovery / GK; each drill has a
  demo video + written description + optional difficulty adjustment; 50+ one-minute skill
  tests with medal tracking. Closest existing product to what we want.
- **TopTekkers, DribbleUp, Beast Mode Soccer app**: same pattern — video demo per drill,
  progressions, self-recorded scores.
- Takeaway: **video-per-drill and per-drill level adjustment are table stakes**; our
  differentiator is the TrainerRoad-style adaptive engine we already started (plan
  generator + progression levels + load tracking).

### 2.4 Video sourcing (freely available)

Embedding YouTube videos via the standard iframe embed is free and permitted; the
[YouTube API developer policies](https://developers.google.com/youtube/terms/developer-policies)
require that we (a) clearly show YouTube as the source and keep player branding visible,
(b) not obscure attribution, and (c) **because our users are children**,   and disable tracking/personalization — practically: use
`youtube-nocookie.com` (privacy-enhanced mode), never autoplay, no related-video rails.

Channels with large, free, high-quality drill libraries suitable for our categories:

| Channel | Strengths | Categories covered |
|---|---|---|
| **7mlc** | Follow-along ball mastery, juggling, tight-space dribbling; hundreds of drills | ball-control, juggling, dribbling, first-touch |
| **Online Soccer Academy (OSA)** | 200+ structured technique tutorials, beginner-friendly | shooting, passing, first-touch, dribbling, juggling |
| **Become Elite** | Full individual sessions, progressions, fitness | all field skills, agility |
| **AllAttack** | Ball mastery, weak foot, 1v1 moves | ball-control, weak-foot, dribbling |
| **Beast Mode Soccer** | Footwork series, individual training design | ball-control, dribbling, first-touch |
| **Simply Soccer / Progressive Soccer** | Solo training, wall work | passing, first-touch, weak-foot |
| **SoccerSource Coaching** (567 free videos) | Coach-facing drills incl. agility/finishing | shooting, agility |

Example video matches already verified for existing seed drills (proof the sourcing works):

- Feet-Only Juggling → 7mlc "How To Juggle a Football Tutorial + 1000 Touch Workout"
  (`youtube.com/watch?v=qN3MG0FDydQ`)
- Toe Taps & Foundations → 7mlc "50 Ball Mastery Exercises" (`watch?v=ObncYq18lMw`)
- Tight-Space Box Dribbling → 7mlc "Improve Your Ball Control in Tight Spaces"
  (`watch?v=eOJsyoR1o_E`)
- Laces Power Striking → OSA "How to Shoot a Soccer Ball with Power"
  (onlinesocceracademy.com hosts the YouTube embed)

Licensing note: standard-license YouTube videos may be **embedded** (that is what the
uploader agreed to) but must never be downloaded, re-hosted, cropped, or stripped of
branding. A minority of coaching videos are CC-BY, which would additionally allow reuse;
treat that as a bonus, not a requirement. Long-term option: commission our own CC-licensed
clips, one per drill family (80 videos, not 320 — variants share the family video with
different start timestamps).

---

## 3. Drill bank taxonomy

Keep the existing 8 skills (they map cleanly to `Skill` rows and to the research
categories). Within each skill, organize drills into **families** — a named progression
ladder of 3–6 leveled variants, exactly like a TrainerRoad workout progression.

Target catalog (~80 families → ~320 variants):

### Juggling (9 families)
| Family | Ladder (level range) |
|---|---|
| Bounce juggling | drop-catch → bounce-juggle → no-bounce intervals (1–3) |
| Feet-only juggling | 5 in a row → 25 → 50 → 100+ (2–7) |
| Alternating-foot juggling | every-other allowed → strict alternate (3–6) |
| Thigh & mixed-surface | thigh only → feet+thigh combos (3–6) |
| Juggling on the move | walk 10m juggling → jog → figure-8 path (5–8) |
| Height control | low-only (below knee) → high-low ladders (5–8) |
| Weak-foot juggling | 5 weak-foot → 25+ (4–8) |
| Around the world & tricks | ATW attempt → clean ATW → combos (7–10) |
| Partner juggling | 2-touch pairs → volley returns (4–7, needs partner) |

### Ball Control / Ball Mastery (12 families)
Toe taps · sole rolls · inside-inside ticktocks · outside-surface work · V-pulls &
pullbacks · La Croqueta · Cruyff / drag-back turn ladder · stationary-to-moving mastery
circuits · fast-feet patterns (in/out, triangles) · sole control figure-8s ·
pressure-clock circuits (timed) · blindfold/heads-up control (scanning). Levels 1–10:
slow stationary → both feet at speed → combined sequences under time pressure.

### Dribbling (11 families)
Straight-line dribble gears (walk/jog/sprint) · cone slalom ladder (spacing shrinks per
level) · box dribbling (space shrinks) · figure-8 dribbling · change-of-direction cuts
(inside/outside/sole) · 1v1 move ladder A: stepover family · 1v1 move ladder B: scissor,
body feint · 1v1 move ladder C: elastico, chop (7–10) · speed dribbling with head up ·
random-cue dribbling (parent calls turns) · combined-move slalom.

### Passing (10 families)
Wall pass foundations (distance/tempo ladder) · two-touch wall passing · one-touch wall
passing · alternating-foot wall work · gate passing accuracy (gate width shrinks) ·
driven passes · lofted/chipped passes · first-time passing off cushion · wall rebounds
at angles · long-range switch passes (8–10, needs space).

### First Touch (9 families)
Cushion control off wall · directional first touch through gates · touch-and-turn ·
aerial control: self-toss thigh/foot/chest · aerial control off wall · bouncing-ball
control · touch under time pressure (beat the bounce) · back-to-wall receive-and-turn ·
juggle-drop-control transitions.

### Shooting & Finishing (10 families)
Passing-accuracy shooting (corner placement, target shrinks) · laces power ladder ·
one-touch finishing off wall rebound · volleys & half-volleys (self-toss → wall) ·
finishing off the dribble · weak-foot finishing · chip/dink finishing · turn-and-shoot ·
long-range striking (8–10) · penalty/free-kick routine + knuckleball intro (9–10).

### Weak Foot (8 families)
Weak-foot wall passing ladder · weak-foot ball mastery (mirror of BC families) ·
weak-foot juggling · weak-foot dribbling slalom · weak-foot first touch · weak-foot
finishing · weak-foot driven/lofted passes · "weak-foot only session" capstones.
(Weak-foot families cross-reference the parent family's video with a "do it all weak
foot" instruction — cheap way to double effective content.)

### Speed & Agility (11 families)
Fast-feet ladder patterns (2-in, icky shuffle, crossovers) · 5-10-5 pro agility ladder ·
acceleration sprints (10–30m) · deceleration & stop mechanics · lateral shuffle + cut ·
jump/land mechanics → bounds (age-gated) · balance & single-leg control · reaction
starts (cue-based) · agility with ball (T-test with dribble) · shuttle endurance runs ·
dynamic warm-up routine (level 1, used as session opener).

**Total: 80 families.** At an average of 4 leveled variants each → **~320 drills**, each
individually selectable by the plan generator, each mapped to the 1–10 scale.

---

## 4. Data model changes

### 4.1 New model: `DrillFamily`

```prisma
model DrillFamily {
  id          String @id            // slug e.g. "feet-only-juggling"
  skillId     String
  skill       Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)
  name        String
  description String
  order       Int    @default(0)    // display order within skill
  drills      Drill[]
}
```

### 4.2 `Drill` additions

```prisma
model Drill {
  // ...existing fields...
  familyId        String?
  family          DrillFamily? @relation(fields: [familyId], references: [id])
  familyLevel     Int?         // 1..N position on the family ladder
  scaling         String       @default("{}") // JSON, see 4.3
  ageMin          Int          @default(6)
  ageMax          Int          @default(99)
  space           String       @default("BACKYARD") // INDOOR | BACKYARD | FIELD
  needs           String       @default("SOLO")     // SOLO | WALL | PARTNER
  // video (see §5)
  videoUrl        String?      // canonical YouTube watch URL
  videoId         String?      // extracted YouTube ID for embeds
  videoStartSec   Int?         // deep-link timestamp for the relevant segment
  videoChannel    String?      // attribution: channel name
}
```

### 4.3 `scaling` JSON shape

Structured "adapt for skill level" knobs, rendered in the UI as *Easier / Harder* chips
and usable by the generator to nudge difficulty ±0.5 without changing drills:

```json
{
  "easier": [
    { "knob": "space",   "text": "Make the box 2 steps bigger" },
    { "knob": "tempo",   "text": "Walk through it before adding speed" },
    { "knob": "bounce",  "text": "Let the ball bounce between touches" }
  ],
  "harder": [
    { "knob": "tempo",   "text": "Beat your rep count in the same 60s" },
    { "knob": "foot",    "text": "Weak foot only" },
    { "knob": "space",   "text": "Halve the grid size" }
  ]
}
```

Knob vocabulary (from §2.2 coaching methodology): `space`, `tempo`, `touches`, `distance`,
`target`, `foot`, `pressure`, `bounce`, `duration`.

### 4.4 Migration strategy

The 23 existing drills become level anchors inside the new families (e.g. current
"Feet-Only Juggling" difficulty 3.5 → family `feet-only-juggling`, familyLevel 2). No
drill IDs change, so existing `SessionDrill` history stays valid.

---

## 5. Video strategy

### 5.1 Sourcing rules

1. **YouTube embeds only** (no downloading/re-hosting). Use the privacy-enhanced domain
   `https://www.youtube-nocookie.com/embed/{videoId}?start={sec}&rel=0`.
2. **Attribution**: show the channel name + "on YouTube" under the player; never overlay
   or crop the player chrome (required by YouTube developer policies).
3. **Child safety/privacy**: no autoplay; `rel=0`; prefer videos that are instructional and ad-light. Player only loads after
   a click on the thumbnail (click-to-load keeps third-party cookies out of first paint).
4. **Segment deep-links**: many source videos cover 5–50 drills; `videoStartSec` points
   at the exact drill inside a compilation, which lets one 7mlc "50 Ball Mastery
   Exercises" video legitimately cover a dozen of our ball-control variants.
5. **Fallbacks**: every drill must remain fully usable text-only (steps + coaching
   points), since videos can be pulled by the uploader. A weekly job (or manual admin
   check initially) hits YouTube oEmbed (`youtube.com/oembed?url=...`) to detect dead
   videos and flags them for re-curation.

### 5.2 Curation pipeline

- Seed files gain a `video` block per drill:
  `{ url, startSec?, channel }` — reviewed by hand before merge (watch the segment,
  confirm it demonstrates the drill as written, confirm embedding is enabled).
- Curation priority: family-level videos first (80 videos ≈ full coverage, since
  variants share the family video with different timestamps), then variant-specific
  upgrades where the ladder meaningfully changes the movement.
- Primary channel per skill (from §2.4): juggling/ball-control/dribbling → 7mlc,
  AllAttack; passing/first-touch/shooting → Online Soccer Academy, Become Elite;
  weak-foot → AllAttack, Beast Mode Soccer; agility → Become Elite, SoccerSource.

### 5.3 UI

- **Drill detail page** (`/drills/[id]`): video card at top (click-to-load embed,
  attribution line), then existing steps/coaching points, then Easier/Harder scaling
  chips, then the family ladder ("You are here: Level 3 of 5") with locked/unlocked
  states based on the child's progression level.
- **Session player** (`/session/[id]`): "Watch how" button per drill expands the same
  embed inline so kids can check form mid-session.
- **Library** (`/drills`): filter by skill, difficulty band, space (indoor/backyard/
  field), needs (solo/wall/partner), has-video; grouped by family with the ladder
  visible — this is the TrainerRoad library browsing experience.

---

## 6. Adaptive engine integration

Changes to `src/lib/plans.ts` and progression logic:

1. **Selection by family ladder**: instead of "closest difficulty in skill", the
   generator walks a family: pick the variant at the child's PL, then next week the same
   family one notch higher (TrainerRoad's "+1 progression"). Rotate 2–3 families per
   skill per plan so sessions vary but progress is legible.
2. **Difficulty labels**: compute `drill.difficulty - childSkill.progressionLevel` →
   ≤0: *Achievable*, 0–0.5: *Productive*, 0.5–1.5: *Stretch*, >1.5: *Breakthrough*.
   Show on every drill card; default plans to Productive with occasional Stretch.
3. **PL updates on completion** (currently missing): completing a session drill at
   difficulty D in skill S with a positive post-session survey (`effort` EASY/MODERATE)
   sets `progressionLevel = max(PL, min(D + 0.3, D_next))`; `HARD` holds; `ALL_OUT` or
   skipped nudges −0.25. Inactivity decay: −0.1/week per skill after 2 idle weeks,
   floored at 1.0 (mirrors TrainerRoad decay).
4. **Age gates**: generator filters variants by `ageMin/ageMax` and by the family's
   `needs` vs. what the child has available (add a one-time "training setup" question:
   wall access? backyard/field? partner sometimes?).

---

## 7. Delivery phases

**Phase 1 — schema + video UI on existing content.**
Prisma migration (`DrillFamily`, new `Drill` columns), click-to-load YouTube embed
component with attribution, video fields wired into drill detail + session player.
Curate videos for the existing 23 drills. Low risk, immediately visible value.

**Phase 2 — restructure into families + first expansion (~120 variants).**
Introduce the 80-family taxonomy in seed data; write the 3 highest-priority skills out
fully (ball-control, juggling, dribbling — the most solo-trainable). Migrate the 23
existing drills into families. Add family-ladder UI to the library.

**Phase 3 — full bank (~320 variants) + adaptive selection.**
Complete remaining skills; switch `plans.ts` to family-ladder selection with difficulty
labels; implement PL update/decay rules; add library filters.

**Phase 4 — feedback loop + content ops.**
Per-drill "too easy / just right / too hard" quick feedback adjusting PL (TrainerRoad's
survey analog); oEmbed link-rot checker; admin curation checklist doc; evaluate
commissioning our own CC-licensed family videos to replace third-party embeds where
they're weakest.

Dependencies/risks: seed-data volume is the big lift (320 variants × steps + cues +
scaling ≈ content-writing work — mitigated by family templates where variants share most
text); YouTube link rot (mitigated by text-first drills + oEmbed checks); COPPA/child
privacy around embeds (mitigated by nocookie domain + click-to-load).

---

## 8. Open questions

1. Add goalkeeping as a 9th skill? (Techne treats GK as its own program; our benchmarks
   model supports it, but video sourcing and family design are a separate effort.)
2. Commission original videos per family (80 clips) once the taxonomy stabilizes, to own
   the content outright?
3. Should partner-required variants be hidden entirely for solo-only kids, or shown
   greyed out as motivation?
