import { mulberry32, defaultDailySeed } from "./engine.js";

// Each puzzle is a generator that produces [sequence[], answer, rule]
const TEMPLATES = [
  { rule: "+n each step", gen: (rng) => {
      const start = 1 + Math.floor(rng() * 10);
      const step = 2 + Math.floor(rng() * 6);
      const seq = Array.from({ length: 5 }, (_, i) => start + step * i);
      return { seq, answer: start + step * 5 };
    } },
  { rule: "×2 each step", gen: (rng) => {
      const start = 1 + Math.floor(rng() * 5);
      const seq = Array.from({ length: 5 }, (_, i) => start * 2 ** i);
      return { seq, answer: start * 2 ** 5 };
    } },
  { rule: "Fibonacci", gen: () => {
      const seq = [1, 1];
      while (seq.length < 6) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
      return { seq: seq.slice(0, 5), answer: seq[5] };
    } },
  { rule: "Squares", gen: (rng) => {
      const offset = Math.floor(rng() * 4);
      const seq = Array.from({ length: 5 }, (_, i) => (i + 1 + offset) ** 2);
      return { seq, answer: (6 + offset) ** 2 };
    } },
  { rule: "Alternating +a/+b", gen: (rng) => {
      const a = 2 + Math.floor(rng() * 4);
      const b = 1 + Math.floor(rng() * 4);
      const seq = [1 + Math.floor(rng() * 5)];
      for (let i = 0; i < 4; i++) seq.push(seq[seq.length - 1] + (i % 2 === 0 ? a : b));
      const answer = seq[seq.length - 1] + (4 % 2 === 0 ? a : b);
      return { seq, answer };
    } },
];

export const sequenceGame = {
  id: "number-sequence",
  name: "Number Sequence",
  description: "What's the next number?",
  difficulty: "medium",
  maxScore: 100,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const t = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
    const { seq, answer } = t.gen(rng);
    return { seq, answer, rule: t.rule };
  },

  getPublicPuzzle(p) { return { seq: p.seq }; },

  validateAnswer(input, p) { return Number(input) === p.answer; },
  getFeedback(input, p) {
    const n = Number(input);
    return { correct: Number.isFinite(n) && n === p.answer };
  },

  scoreAnswer(input, p, ctx) {
    const correct = this.validateAnswer(input, p);
    const guesses = Math.max(1, ctx.guesses || 1);
    const score = correct ? Math.max(30, 100 - (guesses - 1) * 30) : 0;
    return {
      score, correct, accuracy: correct ? 1 / guesses : 0,
      metadata: { answer: p.answer, rule: p.rule, guesses },
    };
  },
};
