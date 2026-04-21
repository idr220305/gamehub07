import { mulberry32, defaultDailySeed, normText } from "./engine.js";

// Simple: an emoji "object" displayed at very low pixel resolution. Client
// renders the emoji scaled way down then up (pixelated) and gradually reveals.

const ITEMS = [
  { emoji: "🦒", answer: "Giraffe", aliases: ["giraffe"] },
  { emoji: "🐘", answer: "Elephant", aliases: ["elephant"] },
  { emoji: "🚀", answer: "Rocket", aliases: ["rocket"] },
  { emoji: "🍕", answer: "Pizza", aliases: ["pizza"] },
  { emoji: "🎸", answer: "Guitar", aliases: ["guitar"] },
  { emoji: "🌳", answer: "Tree", aliases: ["tree"] },
  { emoji: "⚽", answer: "Soccer ball", aliases: ["soccer ball", "football", "soccer"] },
  { emoji: "🐧", answer: "Penguin", aliases: ["penguin"] },
  { emoji: "🚲", answer: "Bicycle", aliases: ["bicycle", "bike"] },
  { emoji: "☂️", answer: "Umbrella", aliases: ["umbrella"] },
  { emoji: "🍦", answer: "Ice cream", aliases: ["ice cream", "icecream"] },
  { emoji: "🦋", answer: "Butterfly", aliases: ["butterfly"] },
];

const STAGES = 4;

export const pixelGame = {
  id: "pixel-guess",
  name: "Pixel Guess",
  description: "Guess the object from a low-res image. Earlier guess = more points.",
  difficulty: "medium",
  maxScore: 100,
  stages: STAGES,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    return { ...ITEMS[Math.floor(rng() * ITEMS.length)], stages: STAGES };
  },

  getPublicPuzzle(p) { return { emoji: p.emoji, stages: p.stages }; },

  validateAnswer(input, p) {
    const n = normText(input);
    return p.aliases.some((a) => normText(a) === n);
  },
  getFeedback(input, p) { return { correct: this.validateAnswer(input, p) }; },

  scoreAnswer(input, p, ctx) {
    const correct = this.validateAnswer(input, p);
    const stage = Math.min(Math.max(0, ctx.stage ?? STAGES - 1), STAGES - 1);
    const score = correct ? [100, 75, 50, 30][stage] : 0;
    return {
      score, correct, accuracy: correct ? 1 - stage / STAGES : 0,
      metadata: { answer: p.answer, stage },
    };
  },
};
