import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// direction "higher" = bigger value is better; "lower" = smaller (e.g. seconds)
const skills = [
  {
    id: "juggling",
    name: "Juggling",
    icon: "🤹",
    description:
      "Keeping the ball in the air with feet, thighs and head. The classic measure of touch and ball mastery.",
    benchmarks: {
      unit: "consecutive juggles",
      direction: "higher",
      bands: [
        { minAge: 10, maxAge: 11, bronze: 10, silver: 25, gold: 50, elite: 100 },
        { minAge: 12, maxAge: 13, bronze: 25, silver: 50, gold: 100, elite: 200 },
        { minAge: 14, maxAge: 99, bronze: 50, silver: 100, gold: 200, elite: 500 },
      ],
    },
  },
  {
    id: "dribbling",
    name: "Dribbling",
    icon: "🏃",
    description:
      "Running with the ball under close control, beating opponents with feints and change of pace.",
    benchmarks: {
      unit: "seconds (20m cone slalom)",
      direction: "lower",
      bands: [
        { minAge: 10, maxAge: 11, bronze: 16, silver: 14, gold: 12.5, elite: 11 },
        { minAge: 12, maxAge: 13, bronze: 14.5, silver: 13, gold: 11.5, elite: 10.5 },
        { minAge: 14, maxAge: 99, bronze: 13.5, silver: 12, gold: 10.8, elite: 9.8 },
      ],
    },
  },
  {
    id: "passing",
    name: "Passing",
    icon: "🎯",
    description:
      "Accurate short and long passing with correct weight, using both inside and outside of the foot.",
    benchmarks: {
      unit: "wall passes in 60s",
      direction: "higher",
      bands: [
        { minAge: 10, maxAge: 11, bronze: 25, silver: 35, gold: 45, elite: 55 },
        { minAge: 12, maxAge: 13, bronze: 30, silver: 42, gold: 52, elite: 62 },
        { minAge: 14, maxAge: 99, bronze: 35, silver: 48, gold: 58, elite: 70 },
      ],
    },
  },
  {
    id: "shooting",
    name: "Shooting",
    icon: "🥅",
    description:
      "Striking the ball with power and placement — laces drive, side-foot placement and volleys.",
    benchmarks: {
      unit: "targets hit out of 10",
      direction: "higher",
      bands: [
        { minAge: 10, maxAge: 11, bronze: 3, silver: 5, gold: 7, elite: 9 },
        { minAge: 12, maxAge: 13, bronze: 4, silver: 6, gold: 8, elite: 9 },
        { minAge: 14, maxAge: 99, bronze: 5, silver: 7, gold: 8, elite: 10 },
      ],
    },
  },
  {
    id: "first-touch",
    name: "First Touch",
    icon: "🦶",
    description:
      "Controlling balls from the air and ground into space with one touch, setting up the next action.",
    benchmarks: {
      unit: "clean controls out of 10 throws",
      direction: "higher",
      bands: [
        { minAge: 10, maxAge: 11, bronze: 4, silver: 6, gold: 8, elite: 10 },
        { minAge: 12, maxAge: 13, bronze: 5, silver: 7, gold: 9, elite: 10 },
        { minAge: 14, maxAge: 99, bronze: 6, silver: 8, gold: 9, elite: 10 },
      ],
    },
  },
  {
    id: "weak-foot",
    name: "Weak Foot",
    icon: "🔄",
    description:
      "Passing, receiving and finishing with your non-dominant foot so defenders can't force you one way.",
    benchmarks: {
      unit: "weak-foot wall passes in 60s",
      direction: "higher",
      bands: [
        { minAge: 10, maxAge: 11, bronze: 15, silver: 22, gold: 30, elite: 40 },
        { minAge: 12, maxAge: 13, bronze: 20, silver: 28, gold: 36, elite: 46 },
        { minAge: 14, maxAge: 99, bronze: 25, silver: 34, gold: 42, elite: 52 },
      ],
    },
  },
  {
    id: "agility",
    name: "Speed & Agility",
    icon: "⚡",
    description:
      "Acceleration, change of direction and footwork — the physical base for every soccer action.",
    benchmarks: {
      unit: "seconds (5-10-5 shuttle)",
      direction: "lower",
      bands: [
        { minAge: 10, maxAge: 11, bronze: 7.5, silver: 7.0, gold: 6.5, elite: 6.0 },
        { minAge: 12, maxAge: 13, bronze: 7.0, silver: 6.5, gold: 6.0, elite: 5.5 },
        { minAge: 14, maxAge: 99, bronze: 6.5, silver: 6.0, gold: 5.5, elite: 5.0 },
      ],
    },
  },
  {
    id: "ball-control",
    name: "Ball Control",
    icon: "🧠",
    description:
      "Close control under pressure — sole rolls, toe taps, turns and shielding in tight spaces.",
    benchmarks: {
      unit: "toe taps in 30s",
      direction: "higher",
      bands: [
        { minAge: 10, maxAge: 11, bronze: 40, silver: 55, gold: 70, elite: 85 },
        { minAge: 12, maxAge: 13, bronze: 50, silver: 65, gold: 80, elite: 95 },
        { minAge: 14, maxAge: 99, bronze: 60, silver: 75, gold: 90, elite: 110 },
      ],
    },
  },
];

type DrillSeed = {
  id: string;
  skillId: string;
  name: string;
  difficulty: number;
  durationMin: number;
  loadScore: number;
  equipment: string;
  description: string;
  instructions: string[];
  coachingPoints: string[];
  targetMetric?: string;
};

const drills: DrillSeed[] = [
  // Juggling
  {
    id: "juggle-bounce",
    skillId: "juggling",
    name: "Bounce Juggling",
    difficulty: 1.5,
    durationMin: 10,
    loadScore: 10,
    equipment: "Ball",
    description: "Learn the juggling motion by letting the ball bounce between touches.",
    instructions: [
      "Drop the ball, let it bounce once, then kick it gently back up to hand height",
      "Catch it, then repeat: drop, bounce, kick, catch",
      "Progress to two touches between catches, then remove the catch",
      "Do 3 sets of 2 minutes, resting 30 seconds between sets",
    ],
    coachingPoints: [
      "Lock your ankle and point your toes slightly up",
      "Strike the middle of the ball with your laces",
      "Soft knees — stay light on your standing foot",
    ],
    targetMetric: "consecutive juggles",
  },
  {
    id: "juggle-feet-only",
    skillId: "juggling",
    name: "Feet-Only Juggling",
    difficulty: 4,
    durationMin: 12,
    loadScore: 14,
    equipment: "Ball",
    description: "Continuous juggling with feet only, alternating left and right.",
    instructions: [
      "Start with your best foot only and get a personal record",
      "Switch to alternating feet: right, left, right, left",
      "Every time the ball drops, restart immediately — count your best streak",
      "Finish with 2 minutes of weak-foot-only juggles",
    ],
    coachingPoints: [
      "Keep the ball below knee height for control",
      "Small, quick touches beat big desperate ones",
      "Eyes on the ball, but relax your shoulders",
    ],
    targetMetric: "consecutive juggles",
  },
  {
    id: "juggle-around-world",
    skillId: "juggling",
    name: "Thigh–Foot Combos & Around the World",
    difficulty: 7,
    durationMin: 15,
    loadScore: 18,
    equipment: "Ball",
    description: "Advanced juggling patterns mixing surfaces and adding a trick.",
    instructions: [
      "Juggle in the pattern: foot, foot, thigh, thigh, head (repeat)",
      "Add height changes: 3 low touches, 1 high touch above your head, control and continue",
      "Attempt Around the World: circle your foot over the ball mid-juggle",
      "Do 4 rounds of 3 minutes",
    ],
    coachingPoints: [
      "Thigh flat like a table when receiving",
      "Reset with a small settle touch after every trick attempt",
      "Consistency first, style second",
    ],
    targetMetric: "consecutive juggles",
  },
  // Dribbling
  {
    id: "dribble-cone-slalom",
    skillId: "dribbling",
    name: "Cone Slalom",
    difficulty: 2.5,
    durationMin: 12,
    loadScore: 15,
    equipment: "Ball, 6 cones (or shoes/bottles)",
    description: "Weave through cones with tight touches at increasing speed.",
    instructions: [
      "Set 6 cones in a line, 2 big steps apart (about 2m)",
      "Dribble through using only the inside of both feet — 4 runs",
      "Then only the outside of both feet — 4 runs",
      "Finish with 4 timed runs at max speed, any surface",
    ],
    coachingPoints: [
      "Touch the ball on every step through the cones",
      "Stay on the balls of your feet",
      "Accelerate out of the last cone every run",
    ],
    targetMetric: "seconds (20m cone slalom)",
  },
  {
    id: "dribble-1v1-moves",
    skillId: "dribbling",
    name: "1v1 Moves: Scissor & Stepover",
    difficulty: 5,
    durationMin: 15,
    loadScore: 18,
    equipment: "Ball, 2 cones",
    description: "Learn and rehearse the two most effective beat-your-man moves.",
    instructions: [
      "Place a cone as your 'defender' 5m ahead",
      "Dribble at it, perform a scissor (foot circles around the ball inside-out), cut away — 10 reps each side",
      "Repeat with the stepover (foot circles outside-in) — 10 reps each side",
      "Combine: stepover + scissor + burst of speed — 10 reps",
    ],
    coachingPoints: [
      "Sell the fake with your whole body, not just the foot",
      "Big drop of the shoulder before the cut",
      "Explode for 3 steps after the move — the move only works with the burst",
    ],
  },
  {
    id: "dribble-tight-space",
    skillId: "dribbling",
    name: "Tight-Space Box Dribbling",
    difficulty: 7.5,
    durationMin: 15,
    loadScore: 20,
    equipment: "Ball, 4 cones",
    description: "High-speed close control in a small box with constant turns.",
    instructions: [
      "Make a 3m x 3m box with 4 cones",
      "Dribble continuously inside for 45 seconds without touching a cone; rest 30s — 6 rounds",
      "Each round add a rule: only left foot, only sole, must turn at every cone, etc.",
      "Last 2 rounds: max speed, count cone touches as errors",
    ],
    coachingPoints: [
      "Head up between touches — scan like there are defenders",
      "Use all surfaces: inside, outside, sole",
      "Sharp turns: chop the ball across your body",
    ],
  },
  // Passing
  {
    id: "pass-wall-basics",
    skillId: "passing",
    name: "Wall Pass Foundations",
    difficulty: 2,
    durationMin: 10,
    loadScore: 12,
    equipment: "Ball, wall (or rebounder / partner)",
    description: "Groove your side-foot passing technique against a wall.",
    instructions: [
      "Stand 3m from a wall, pass with the inside of your right foot — 25 reps",
      "Repeat with your left foot — 25 reps",
      "Alternate feet one-touch — 2 minutes",
      "Finish with a 60-second max-count test (both feet)",
    ],
    coachingPoints: [
      "Plant foot points at your target",
      "Strike through the middle of the ball with a firm ankle",
      "Follow through low — the pass should hug the ground",
    ],
    targetMetric: "wall passes in 60s",
  },
  {
    id: "pass-one-touch",
    skillId: "passing",
    name: "One-Touch Angle Passing",
    difficulty: 5,
    durationMin: 12,
    loadScore: 15,
    equipment: "Ball, wall, 2 cones",
    description: "One-touch passing while moving between gates, like a real give-and-go.",
    instructions: [
      "Place 2 cones 2m apart, 4m from the wall",
      "Pass against the wall from one cone, move laterally, return the rebound from the other cone",
      "Continuous for 60 seconds, rest 30 — 6 rounds",
      "Alternate which foot receives and which passes every round",
    ],
    coachingPoints: [
      "Open your hips to the wall before the ball arrives",
      "Pass and MOVE — never watch your pass standing still",
      "Weight the pass so the rebound reaches the next cone",
    ],
    targetMetric: "wall passes in 60s",
  },
  {
    id: "pass-long-driven",
    skillId: "passing",
    name: "Driven & Lofted Long Passes",
    difficulty: 7,
    durationMin: 15,
    loadScore: 17,
    equipment: "Ball, open space, target (cone/goal)",
    description: "Switch-of-play passing: low driven balls and lofted passes to a target.",
    instructions: [
      "Set a 2m target zone 20m away (adjust to your range)",
      "Driven pass with laces, ball stays under head height — 10 reps each foot",
      "Lofted pass, striking under the ball — 10 reps each foot",
      "Score each rep: 2 points in the zone, 1 point close — track your total out of 80",
    ],
    coachingPoints: [
      "Approach at a slight angle, last step is a long plant",
      "For driven: strike the middle, lock the ankle, low follow-through",
      "For lofted: lean back slightly, slice under the ball",
    ],
  },
  // Shooting
  {
    id: "shoot-placement",
    skillId: "shooting",
    name: "Corner Placement Shooting",
    difficulty: 3,
    durationMin: 12,
    loadScore: 15,
    equipment: "Ball, goal or marked target on wall",
    description: "Accuracy before power: pass the ball into the corners.",
    instructions: [
      "Mark two targets in the bottom corners of the goal (cones or tape)",
      "From 10m, side-foot finish to the far corner — 10 reps each foot",
      "Take one touch out of your feet, then finish — 10 reps each foot",
      "Test: 10 shots alternating corners, count hits",
    ],
    coachingPoints: [
      "Look up once before you strike to pick your corner",
      "Side-foot like a firm pass — placement beats power from close range",
      "Land on your shooting foot moving toward goal",
    ],
    targetMetric: "targets hit out of 10",
  },
  {
    id: "shoot-power-laces",
    skillId: "shooting",
    name: "Laces Power Striking",
    difficulty: 5.5,
    durationMin: 15,
    loadScore: 18,
    equipment: "Ball, goal, cones",
    description: "Develop a clean, powerful strike with the laces.",
    instructions: [
      "From 15m, roll the ball forward and strike with laces — 8 reps each foot",
      "Add a dribble at pace before the strike — 8 reps each foot",
      "Aim for height discipline: everything under crossbar height",
      "Finish with 10 shots for accuracy AND power, count targets hit",
    ],
    coachingPoints: [
      "Toes down, ankle locked, strike the middle of the ball",
      "Head down and over the ball at contact",
      "Follow through toward the target, land on the shooting foot",
    ],
    targetMetric: "targets hit out of 10",
  },
  {
    id: "shoot-first-time",
    skillId: "shooting",
    name: "First-Time Finishing & Volleys",
    difficulty: 7.5,
    durationMin: 15,
    loadScore: 20,
    equipment: "Ball, goal, wall or partner",
    description: "Finish moving balls first-time: rebounds, rollers, and volleys.",
    instructions: [
      "Pass off the wall, finish the rebound first-time — 10 reps each foot",
      "Self-toss and half-volley into the goal — 10 reps each foot",
      "Full volley from a self-toss — 10 reps each foot",
      "Test: 10 first-time finishes, count targets hit",
    ],
    coachingPoints: [
      "Adjust your feet early — small steps to the ball",
      "For volleys: knee over the ball, strike down through it",
      "Balance arm out wide",
    ],
    targetMetric: "targets hit out of 10",
  },
  // First touch
  {
    id: "touch-cushion",
    skillId: "first-touch",
    name: "Cushion Control",
    difficulty: 2.5,
    durationMin: 10,
    loadScore: 12,
    equipment: "Ball, wall or partner",
    description: "Soft first touch from ground passes and gentle throws.",
    instructions: [
      "Pass firmly against the wall, cushion the rebound dead with your inside foot — 15 reps each foot",
      "Self-throw at thigh height, cushion with thigh, then pass back — 15 reps",
      "Self-throw and control with your laces like catching an egg — 15 reps",
    ],
    coachingPoints: [
      "Move your controlling surface back at the moment of contact",
      "Get in line with the ball early",
      "First touch should stay within one step of you",
    ],
    targetMetric: "clean controls out of 10 throws",
  },
  {
    id: "touch-directional",
    skillId: "first-touch",
    name: "Directional First Touch",
    difficulty: 5,
    durationMin: 12,
    loadScore: 15,
    equipment: "Ball, wall, 2 cones",
    description: "Take your first touch into space, away from pressure.",
    instructions: [
      "Set 2 gates (cones) 2m to your left and right",
      "Pass against the wall; take your first touch through a gate, then pass again — 20 reps",
      "Alternate gates and alternate inside/outside foot touches",
      "Add a fake before the touch: look left, touch right",
    ],
    coachingPoints: [
      "Decide where your touch is going BEFORE the ball arrives",
      "Touch into space at an angle, not straight sideways",
      "Scan over your shoulder before receiving",
    ],
    targetMetric: "clean controls out of 10 throws",
  },
  {
    id: "touch-aerial",
    skillId: "first-touch",
    name: "Aerial Control",
    difficulty: 7,
    durationMin: 15,
    loadScore: 17,
    equipment: "Ball",
    description: "Kill high balls dead with foot, thigh, and chest.",
    instructions: [
      "Kick the ball high above your head, control with your laces — 10 reps",
      "Repeat controlling with thigh then foot — 10 reps",
      "Repeat with chest, thigh, foot — 10 reps",
      "Test: 10 high balls, count how many you control within two steps",
    ],
    coachingPoints: [
      "Watch the ball all the way onto the surface",
      "Relax the surface on contact — stiff surfaces bounce",
      "Second touch should set up a pass or dribble immediately",
    ],
    targetMetric: "clean controls out of 10 throws",
  },
  // Weak foot
  {
    id: "weak-wall-passing",
    skillId: "weak-foot",
    name: "Weak-Foot Wall Work",
    difficulty: 3,
    durationMin: 10,
    loadScore: 12,
    equipment: "Ball, wall",
    description: "Build passing confidence with your non-dominant foot.",
    instructions: [
      "Two-touch passing with weak foot only (control + pass) — 3 minutes",
      "One-touch weak-foot passing — 2 minutes",
      "60-second max-count test, weak foot only",
    ],
    coachingPoints: [
      "Slow down: perfect technique at 70% speed",
      "Same checklist as strong foot: plant foot aimed, ankle locked",
      "Expect it to feel clumsy — that feeling is the training working",
    ],
    targetMetric: "weak-foot wall passes in 60s",
  },
  {
    id: "weak-dribble-finish",
    skillId: "weak-foot",
    name: "Weak-Foot Dribble & Finish",
    difficulty: 6,
    durationMin: 15,
    loadScore: 17,
    equipment: "Ball, 4 cones, goal or target",
    description: "Slalom and finish using only your weak foot.",
    instructions: [
      "Slalom through 4 cones using weak foot only — 8 runs",
      "Finish each run with a weak-foot shot at a target",
      "Score: 1 point clean slalom, 1 point target hit — track out of 16",
      "Last 3 runs at match speed",
    ],
    coachingPoints: [
      "Keep touches shorter than usual on the weak side",
      "Strike through the ball — don't stab at it",
      "Finish every rep, even after a bad touch, like in a game",
    ],
  },
  // Agility
  {
    id: "agility-ladder-feet",
    skillId: "agility",
    name: "Fast Feet Ladder Patterns",
    difficulty: 3,
    durationMin: 12,
    loadScore: 16,
    equipment: "Agility ladder (or chalk/sticks)",
    description: "Classic footwork patterns for coordination and quickness.",
    instructions: [
      "Two feet in each square, forward — 4 runs",
      "Lateral two-in-two-out — 4 runs each direction",
      "Icky shuffle (in-in-out moving sideways) — 4 runs each direction",
      "Single-leg hops through — 2 runs each leg",
    ],
    coachingPoints: [
      "Stay on the balls of your feet, arms pumping",
      "Speed comes after the pattern is perfect",
      "Quiet feet — light contacts, not stomps",
    ],
  },
  {
    id: "agility-shuttle",
    skillId: "agility",
    name: "5-10-5 Pro Agility Shuttle",
    difficulty: 5.5,
    durationMin: 15,
    loadScore: 20,
    equipment: "3 cones, stopwatch",
    description: "The standard change-of-direction test used in pro combines.",
    instructions: [
      "Set 3 cones in a line, 5m apart; start at the middle cone",
      "Sprint 5m right, touch the line, sprint 10m left, touch, sprint 5m back through the middle",
      "6 timed reps with full recovery (90s) between",
      "Record your best time",
    ],
    coachingPoints: [
      "Stay low into the turns, drop your hips",
      "Push off the outside foot when changing direction",
      "First three steps out of each turn are everything",
    ],
    targetMetric: "seconds (5-10-5 shuttle)",
  },
  {
    id: "agility-acceleration",
    skillId: "agility",
    name: "Acceleration Sprints & Bounds",
    difficulty: 7,
    durationMin: 15,
    loadScore: 22,
    equipment: "Cones, 20m of space",
    description: "Build explosive first-step speed with sprints and plyometrics.",
    instructions: [
      "Warm up: 2 x 20m at 60%, 2 x 20m at 80%",
      "6 x 15m max sprints from different starts (standing, lying, side-on), full recovery",
      "3 x 6 forward bounds (long jumping strides)",
      "3 x 10 lateral skater hops each side",
    ],
    coachingPoints: [
      "Drive your arms hard — they set leg speed",
      "Lean forward from the ankles on acceleration",
      "Full rest between sprints; quality over quantity",
    ],
  },
  // Ball control
  {
    id: "control-toe-taps",
    skillId: "ball-control",
    name: "Toe Taps & Foundations",
    difficulty: 1.5,
    durationMin: 8,
    loadScore: 10,
    equipment: "Ball",
    description: "Rhythm and touch fundamentals: toe taps and sole rolls.",
    instructions: [
      "Toe taps (alternate feet tapping the top of the ball) — 3 x 30 seconds",
      "Foundations (pass the ball between insteps) — 3 x 30 seconds",
      "Sole rolls side to side — 3 x 30 seconds",
      "Test: max toe taps in 30 seconds",
    ],
    coachingPoints: [
      "Bounce on the balls of your feet like a boxer",
      "Keep your knees bent and back straight",
      "Build a steady rhythm, then speed it up",
    ],
    targetMetric: "toe taps in 30s",
  },
  {
    id: "control-la-croqueta",
    skillId: "ball-control",
    name: "Turns: Cruyff, Croqueta & Drag-Back",
    difficulty: 5,
    durationMin: 12,
    loadScore: 15,
    equipment: "Ball, 2 cones",
    description: "Three game-changing turns to escape pressure.",
    instructions: [
      "Dribble 5m, drag-back turn, return — 8 reps each foot",
      "Cruyff turn (fake pass, chop behind standing leg) — 8 reps each foot",
      "La croqueta (quick side-to-side shift between feet) through a 1m gate — 10 reps",
      "Chain all three in one continuous circuit — 5 rounds",
    ],
    coachingPoints: [
      "Sell the fake before every turn",
      "Shield the ball with your body as you turn",
      "Accelerate out of the turn",
    ],
  },
  {
    id: "control-pressure-circuit",
    skillId: "ball-control",
    name: "Pressure Control Circuit",
    difficulty: 8,
    durationMin: 15,
    loadScore: 20,
    equipment: "Ball, 4 cones",
    description: "High-intensity control circuit simulating match pressure.",
    instructions: [
      "40 seconds max-speed toe taps, straight into",
      "40 seconds tight box dribbling (2m box), straight into",
      "40 seconds sole rolls with direction changes; rest 60 seconds",
      "5 full rounds — count total errors (ball escapes) and try to beat it",
    ],
    coachingPoints: [
      "Keep quality when your legs burn — that's the training goal",
      "Breathe and keep your head up",
      "Track errors honestly; improvement = fewer errors at same speed",
    ],
    targetMetric: "toe taps in 30s",
  },
];

const badges = [
  { id: "first-session", name: "First Whistle", icon: "🎉", description: "Complete your first training session." },
  { id: "streak-3", name: "On Fire", icon: "🔥", description: "Train 3 days in a row." },
  { id: "streak-7", name: "Unstoppable Week", icon: "⚡", description: "Reach a 7-day training streak." },
  { id: "streak-30", name: "Iron Month", icon: "🏆", description: "Reach a 30-day training streak." },
  { id: "sessions-10", name: "Ten Timer", icon: "🔟", description: "Complete 10 training sessions." },
  { id: "sessions-50", name: "Half Century", icon: "💯", description: "Complete 50 training sessions." },
  { id: "bronze-first", name: "Bronze Boot", icon: "🥉", description: "Earn Bronze in any skill." },
  { id: "silver-first", name: "Silver Boot", icon: "🥈", description: "Earn Silver in any skill." },
  { id: "gold-first", name: "Golden Boot", icon: "🥇", description: "Earn Gold in any skill." },
  { id: "elite-first", name: "Elite Prospect", icon: "🌟", description: "Reach Elite tier in any skill." },
  { id: "all-bronze", name: "Complete Player", icon: "🛡️", description: "Earn Bronze or better in every skill." },
  { id: "level-5", name: "Rising Star", icon: "⭐", description: "Reach player level 5." },
  { id: "level-10", name: "Captain Material", icon: "©️", description: "Reach player level 10." },
  { id: "plan-finisher", name: "Plan Crusher", icon: "📅", description: "Complete every session in a training plan." },
  { id: "early-bird", name: "Weak Foot Warrior", icon: "🔄", description: "Complete 5 weak-foot focused sessions." },
];

async function main() {
  for (const s of skills) {
    const data = { name: s.name, icon: s.icon, description: s.description, benchmarks: JSON.stringify(s.benchmarks) };
    await prisma.skill.upsert({ where: { id: s.id }, update: data, create: { id: s.id, ...data } });
  }
  for (const d of drills) {
    const data = {
      skillId: d.skillId,
      name: d.name,
      difficulty: d.difficulty,
      durationMin: d.durationMin,
      loadScore: d.loadScore,
      equipment: d.equipment,
      description: d.description,
      instructions: d.instructions.join("\n"),
      coachingPoints: d.coachingPoints.join("\n"),
      targetMetric: d.targetMetric ?? null,
    };
    await prisma.drill.upsert({ where: { id: d.id }, update: data, create: { id: d.id, ...data } });
  }
  for (const b of badges) {
    await prisma.badge.upsert({ where: { id: b.id }, update: b, create: b });
  }
  console.log(`Seeded ${skills.length} skills, ${drills.length} drills, ${badges.length} badges`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
