import { mulberry32, defaultDailySeed } from "./engine.js";

// The client handles the actual timing. The server just validates and scores
// based on the reported reaction-time (ms).

export const reactionGame = {
  id: "reaction",
  name: "Reaction Time",
  description: "Click the instant the screen changes. Faster = more points.",
  difficulty: "easy",
  maxScore: 100,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    // Pre-compute a hidden "wait time" so all clients agree on difficulty.
    const waitMs = 1500 + Math.floor(rng() * 3500); // 1.5s–5s
    return { waitMs };
  },

  // Client needs to know the wait window (it uses this to schedule the color change).
  getPublicPuzzle(p) { return { waitMs: p.waitMs }; },

  // Input = reaction time in ms (must be >= 0).
  validateAnswer(input, p) {
    const n = Number(input);
    return Number.isFinite(n) && n >= 0 && n < 5000;
  },
  getFeedback(input, p) {
    const n = Number(input);
    const ok = this.validateAnswer(input, p);
    return { correct: ok, reactionMs: ok ? n : null };
  },

  scoreAnswer(input, p, ctx) {
    const n = Number(input);
    if (!Number.isFinite(n) || n < 0) {
      return { score: 0, correct: false, accuracy: 0, metadata: { reactionMs: null } };
    }
    if (n < 100) {
      // False start — clicked too early.
      return { score: 0, correct: false, accuracy: 0, metadata: { reactionMs: n, falseStart: true } };
    }
    // 200ms = 100, 500ms = 80, 800ms = 60, 1200ms = 30, 1500ms+ = 10.
    let score;
    if (n <= 200) score = 100;
    else if (n <= 500) score = Math.round(100 - ((n - 200) / 300) * 20);
    else if (n <= 800) score = Math.round(80 - ((n - 500) / 300) * 20);
    else if (n <= 1200) score = Math.round(60 - ((n - 800) / 400) * 30);
    else if (n <= 1500) score = Math.round(30 - ((n - 1200) / 300) * 20);
    else score = 10;
    return {
      score, correct: score >= 50,
      accuracy: Math.max(0, Math.min(1, (1500 - n) / 1300)),
      metadata: { reactionMs: n },
    };
  },
};
