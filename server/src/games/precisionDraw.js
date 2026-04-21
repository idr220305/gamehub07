import { mulberry32, defaultDailySeed } from "./engine.js";

// Target shapes expressed as a sequence of (x, y) points in a 400x400 canvas.
const SHAPES = [
  {
    name: "Circle",
    // 60-point circle centered at (200, 200), radius 120.
    points: Array.from({ length: 60 }, (_, i) => {
      const t = (i / 60) * Math.PI * 2;
      return { x: 200 + Math.cos(t) * 120, y: 200 + Math.sin(t) * 120 };
    }),
    closed: true,
  },
  {
    name: "Triangle",
    points: [
      { x: 200, y: 60 },
      { x: 340, y: 320 },
      { x: 60, y: 320 },
      { x: 200, y: 60 },
    ],
    closed: true,
  },
  {
    name: "Square",
    points: [
      { x: 80, y: 80 },
      { x: 320, y: 80 },
      { x: 320, y: 320 },
      { x: 80, y: 320 },
      { x: 80, y: 80 },
    ],
    closed: true,
  },
  {
    name: "Star",
    points: (() => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 140 : 60;
        const t = (i / 10) * Math.PI * 2 - Math.PI / 2;
        pts.push({ x: 200 + Math.cos(t) * r, y: 200 + Math.sin(t) * r });
      }
      pts.push({ ...pts[0] });
      return pts;
    })(),
    closed: true,
  },
];

// Sample N evenly-spaced points along a polyline.
function resample(points, n) {
  if (points.length < 2) return points.slice();
  const segs = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segs.push({ a: points[i], b: points[i + 1], d });
    total += d;
  }
  if (total === 0) return Array(n).fill(points[0]);
  const step = total / (n - 1);
  const out = [points[0]];
  let segIdx = 0;
  let segRem = segs[0].d;
  let acc = 0;
  for (let i = 1; i < n - 1; i++) {
    let target = i * step;
    while (acc + segRem < target && segIdx < segs.length - 1) {
      acc += segRem;
      segIdx++;
      segRem = segs[segIdx].d;
    }
    const localT = segRem > 0 ? (target - acc) / segRem : 0;
    const { a, b } = segs[segIdx];
    out.push({ x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT });
    acc += localT * segRem;
    segRem -= localT * segRem;
  }
  out.push(points[points.length - 1]);
  return out;
}

// Similarity score between two polylines after resampling both to N points.
// Aligns rotation by matching the user's start to the target's nearest point,
// and tries both directions.
function similarity(userPts, targetPts, closed) {
  const N = 40;
  if (userPts.length < 2) return 0;
  const u = resample(userPts, N);
  const t = resample(targetPts, N);
  // If shape is closed, find best rotational alignment.
  const tryAlign = (order) => {
    let best = Infinity;
    const rotations = closed ? N : 1;
    for (let r = 0; r < rotations; r++) {
      let sum = 0;
      for (let i = 0; i < N; i++) {
        const ui = order === 1 ? i : N - 1 - i;
        const ti = (i + r) % N;
        sum += Math.hypot(u[ui].x - t[ti].x, u[ui].y - t[ti].y);
      }
      if (sum < best) best = sum;
    }
    return best / N;
  };
  const best = Math.min(tryAlign(1), tryAlign(-1));
  // Map average distance (pixels) to a 0..1 score. 0px = 1.0, 80px = 0.0.
  return Math.max(0, Math.min(1, 1 - best / 80));
}

export const drawGame = {
  id: "precision-draw",
  name: "Precision Draw",
  description: "Trace the shape as closely as you can — closer = more points.",
  difficulty: "easy",
  maxScore: 100,

  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const pick = SHAPES[Math.floor(rng() * SHAPES.length)];
    return { name: pick.name, target: pick.points, closed: pick.closed };
  },

  getPublicPuzzle(puzzle) {
    return { name: puzzle.name, target: puzzle.target, closed: puzzle.closed };
  },

  validateAnswer(input, puzzle) {
    return Array.isArray(input) && input.length >= 2;
  },

  getFeedback(input, puzzle) {
    if (!this.validateAnswer(input, puzzle)) return { correct: false, similarity: 0 };
    const sim = similarity(input, puzzle.target, puzzle.closed);
    return { correct: sim > 0.5, similarity: sim };
  },

  scoreAnswer(input, puzzle, ctx) {
    if (!this.validateAnswer(input, puzzle)) {
      return { score: 0, correct: false, accuracy: 0, metadata: {} };
    }
    const sim = similarity(input, puzzle.target, puzzle.closed);
    const score = Math.round(sim * this.maxScore);
    return {
      score,
      correct: sim > 0.5,
      accuracy: sim,
      metadata: { similarity: sim, shape: puzzle.name },
    };
  },
};
