import { mulberry32, defaultDailySeed, normText } from "./engine.js";

const WORDS = [
  "telescope", "magnetic", "hurricane", "vertical", "fascinate", "astronomy",
  "parallel", "gravity", "molecule", "triangle", "universe", "hospital",
  "parachute", "landscape", "symphony", "pendulum", "ambulance", "chemistry",
  "literature", "photograph", "tournament", "vocabulary", "refrigerator", "adventure",
  "boulevard", "headquarters", "orchestra", "reservoir", "secretary", "manuscript",
];

function scramble(rng, word) {
  const arr = word.split("");
  let attempts = 0;
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    attempts++;
  } while (arr.join("") === word && attempts < 5);
  return arr.join("");
}

export const anagramGame = {
  id: "anagram",
  name: "Anagram Hunt",
  description: "Unscramble the letters to find the original word.",
  difficulty: "medium",
  maxScore: 100,
  maxGuesses: 3,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const answer = WORDS[Math.floor(rng() * WORDS.length)];
    return { answer, scrambled: scramble(rng, answer), maxGuesses: this.maxGuesses };
  },

  getPublicPuzzle(p) { return { scrambled: p.scrambled, maxGuesses: p.maxGuesses }; },

  validateAnswer(input, p) { return normText(input) === normText(p.answer); },
  getFeedback(input, p) { return { correct: this.validateAnswer(input, p) }; },

  scoreAnswer(input, p, ctx) {
    const correct = this.validateAnswer(input, p);
    const guesses = Math.max(1, ctx.guesses || 1);
    const score = correct ? Math.max(30, this.maxScore - (guesses - 1) * 30) : 0;
    return {
      score, correct,
      accuracy: correct ? 1 - (guesses - 1) / p.maxGuesses : 0,
      metadata: { answer: p.answer, guesses },
    };
  },
};
