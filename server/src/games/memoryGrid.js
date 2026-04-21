import { mulberry32, defaultDailySeed } from "./engine.js";

const GRID = 4; // 4x4
const PATTERN_SIZE = 6; // 6 cells lit

export const memoryGame = {
  id: "memory-grid",
  name: "Memory Grid",
  description: "Study the pattern briefly, then tap the cells you remember.",
  difficulty: "medium",
  maxScore: 100,
  gridSize: GRID,
  patternSize: PATTERN_SIZE,
  previewMs: 3000,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const cells = [];
    while (cells.length < PATTERN_SIZE) {
      const c = Math.floor(rng() * GRID * GRID);
      if (!cells.includes(c)) cells.push(c);
    }
    return { pattern: cells.sort((a, b) => a - b), gridSize: GRID, previewMs: this.previewMs };
  },

  getPublicPuzzle(p) {
    return { pattern: p.pattern, gridSize: p.gridSize, previewMs: p.previewMs };
  },

  validateAnswer(input, p) {
    return Array.isArray(input) && input.length > 0;
  },

  getFeedback(input, p) {
    const set = new Set(p.pattern);
    const picks = Array.isArray(input) ? input : [];
    const hits = picks.filter((c) => set.has(c)).length;
    const missed = p.pattern.filter((c) => !picks.includes(c));
    const extra = picks.filter((c) => !set.has(c));
    return { correct: hits === p.pattern.length && extra.length === 0, hits, missed, extra };
  },

  scoreAnswer(input, p, ctx) {
    const fb = this.getFeedback(input, p);
    const total = p.pattern.length;
    // +10 per hit, -5 per extra false-positive.
    const raw = fb.hits * 10 - fb.extra.length * 5;
    // Perfect = 100.
    const score = fb.correct ? 100 : Math.max(0, Math.min(90, raw * (100 / (total * 10))));
    return {
      score: Math.round(score),
      correct: fb.correct,
      accuracy: fb.hits / total,
      metadata: { pattern: p.pattern, hits: fb.hits, extra: fb.extra.length },
    };
  },
};
