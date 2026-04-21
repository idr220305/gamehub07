import { mulberry32, defaultDailySeed } from "./engine.js";

const STATEMENTS = [
  { text: "The Pacific Ocean is the largest ocean on Earth.", answer: true },
  { text: "Lightning never strikes the same place twice.", answer: false },
  { text: "Humans share about 60% of their DNA with bananas.", answer: true },
  { text: "A group of crows is called a murder.", answer: true },
  { text: "Goldfish have a memory of only 3 seconds.", answer: false },
  { text: "Venus is the hottest planet in our solar system.", answer: true },
  { text: "The Great Wall of China is visible from the Moon with the naked eye.", answer: false },
  { text: "Octopuses have three hearts.", answer: true },
  { text: "Bulls are enraged by the color red.", answer: false },
  { text: "Honey never spoils.", answer: true },
  { text: "Bananas grow on trees.", answer: false },
  { text: "The human body has more than 600 muscles.", answer: true },
  { text: "Sharks are mammals.", answer: false },
  { text: "Mount Everest gets taller each year.", answer: true },
  { text: "The Eiffel Tower was originally intended to be temporary.", answer: true },
];

export const tfGame = {
  id: "true-false",
  name: "True or False",
  description: "Quick — is this claim true or false?",
  difficulty: "easy",
  maxScore: 100,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    return { ...STATEMENTS[Math.floor(rng() * STATEMENTS.length)] };
  },

  getPublicPuzzle(p) { return { text: p.text }; },

  validateAnswer(input, p) { return Boolean(input) === p.answer; },
  getFeedback(input, p) {
    return { correct: this.validateAnswer(input, p), truth: p.answer };
  },

  scoreAnswer(input, p, ctx) {
    const correct = this.validateAnswer(input, p);
    // Reward speed: <3s = 100, <6s = 80, else 60.
    const t = Number(ctx.timeTaken) || 6000;
    let score = 0;
    if (correct) score = t < 3000 ? 100 : t < 6000 ? 80 : 60;
    return {
      score, correct, accuracy: correct ? 1 : 0,
      metadata: { answer: p.answer, picked: Boolean(input), timeMs: t },
    };
  },
};
