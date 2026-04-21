import { mulberry32, defaultDailySeed, normText } from "./engine.js";

const CAPITALS = [
  { country: "France", flag: "🇫🇷", capital: "Paris", aliases: ["paris"] },
  { country: "Japan", flag: "🇯🇵", capital: "Tokyo", aliases: ["tokyo"] },
  { country: "Egypt", flag: "🇪🇬", capital: "Cairo", aliases: ["cairo"] },
  { country: "Australia", flag: "🇦🇺", capital: "Canberra", aliases: ["canberra"] },
  { country: "Canada", flag: "🇨🇦", capital: "Ottawa", aliases: ["ottawa"] },
  { country: "Brazil", flag: "🇧🇷", capital: "Brasília", aliases: ["brasilia", "brasília"] },
  { country: "India", flag: "🇮🇳", capital: "New Delhi", aliases: ["new delhi", "delhi"] },
  { country: "Kenya", flag: "🇰🇪", capital: "Nairobi", aliases: ["nairobi"] },
  { country: "Norway", flag: "🇳🇴", capital: "Oslo", aliases: ["oslo"] },
  { country: "Thailand", flag: "🇹🇭", capital: "Bangkok", aliases: ["bangkok"] },
  { country: "Turkey", flag: "🇹🇷", capital: "Ankara", aliases: ["ankara"] },
  { country: "South Korea", flag: "🇰🇷", capital: "Seoul", aliases: ["seoul"] },
  { country: "Portugal", flag: "🇵🇹", capital: "Lisbon", aliases: ["lisbon", "lisboa"] },
  { country: "Greece", flag: "🇬🇷", capital: "Athens", aliases: ["athens"] },
  { country: "Argentina", flag: "🇦🇷", capital: "Buenos Aires", aliases: ["buenos aires"] },
  { country: "Netherlands", flag: "🇳🇱", capital: "Amsterdam", aliases: ["amsterdam"] },
  { country: "Sweden", flag: "🇸🇪", capital: "Stockholm", aliases: ["stockholm"] },
  { country: "Morocco", flag: "🇲🇦", capital: "Rabat", aliases: ["rabat"] },
  { country: "Vietnam", flag: "🇻🇳", capital: "Hanoi", aliases: ["hanoi"] },
  { country: "Poland", flag: "🇵🇱", capital: "Warsaw", aliases: ["warsaw", "warszawa"] },
];

export const capitalGame = {
  id: "capital",
  name: "Guess the Capital",
  description: "Name the capital city of the given country.",
  difficulty: "easy",
  maxScore: 100,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const pick = CAPITALS[Math.floor(rng() * CAPITALS.length)];
    return { ...pick };
  },

  getPublicPuzzle(p) { return { country: p.country, flag: p.flag }; },

  validateAnswer(input, p) {
    const n = normText(input);
    return p.aliases.some((a) => normText(a) === n);
  },
  getFeedback(input, p) { return { correct: this.validateAnswer(input, p) }; },

  scoreAnswer(input, p, ctx) {
    const correct = this.validateAnswer(input, p);
    const guesses = Math.max(1, ctx.guesses || 1);
    const score = correct ? Math.max(30, 100 - (guesses - 1) * 25) : 0;
    return {
      score, correct,
      accuracy: correct ? 1 / guesses : 0,
      metadata: { answer: p.capital, guesses },
    };
  },
};
