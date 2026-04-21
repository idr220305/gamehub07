import { mulberry32, defaultDailySeed, fuzzyEqual } from "./engine.js";

const PHRASES = [
  { emojis: "🦁👑", answer: "The Lion King" },
  { emojis: "🕷️👨", answer: "Spider Man" },
  { emojis: "🌟⚔️", answer: "Star Wars" },
  { emojis: "❄️👸", answer: "Frozen" },
  { emojis: "🐟🔍", answer: "Finding Nemo" },
  { emojis: "🧙‍♂️💍", answer: "Lord of the Rings" },
  { emojis: "🦇🦸", answer: "Batman" },
  { emojis: "🏰🐭", answer: "Disney World" },
  { emojis: "🚢🧊💔", answer: "Titanic" },
  { emojis: "👽📞🏠", answer: "E.T." },
  { emojis: "🐒🍌🏝️", answer: "Planet of the Apes" },
  { emojis: "🐠🐠", answer: "Finding Dory" },
  { emojis: "🧛🌙", answer: "Twilight" },
  { emojis: "🎩🐰", answer: "Alice in Wonderland" },
  { emojis: "🦖🏞️", answer: "Jurassic Park" },
  { emojis: "🤖🚗", answer: "Transformers" },
  { emojis: "👻👻👻", answer: "Ghostbusters" },
  { emojis: "🍫🏭", answer: "Charlie and the Chocolate Factory" },
  { emojis: "🦈🌊", answer: "Jaws" },
  { emojis: "🔴💊🔵💊", answer: "The Matrix" },
  { emojis: "🐷🕸️", answer: "Charlotte's Web" },
  { emojis: "🎸🎤🌟", answer: "A Star is Born" },
  { emojis: "🏃‍♂️🍫", answer: "Forrest Gump" },
  { emojis: "🍕🐢", answer: "Teenage Mutant Ninja Turtles" },
  { emojis: "👨‍🍳🐀", answer: "Ratatouille" },
];

export const emojiGame = {
  id: "emoji",
  name: "Emoji Phrase",
  description: "Guess the movie from emojis. Fewer guesses = more points.",
  difficulty: "easy",
  maxScore: 100,
  maxGuesses: 5,

  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const pick = PHRASES[Math.floor(rng() * PHRASES.length)];
    return { emojis: pick.emojis, answer: pick.answer, maxGuesses: this.maxGuesses };
  },

  getPublicPuzzle(puzzle) {
    return { emojis: puzzle.emojis, maxGuesses: puzzle.maxGuesses };
  },

  validateAnswer(input, puzzle) {
    return fuzzyEqual(input, puzzle.answer);
  },

  // Feedback for a tentative guess, called before commit.
  // Returns { correct } so the UI can flash green/red.
  getFeedback(input, puzzle) {
    return { correct: this.validateAnswer(input, puzzle) };
  },

  scoreAnswer(input, puzzle, ctx) {
    const correct = this.validateAnswer(input, puzzle);
    const guesses = Math.max(1, ctx.guesses || 1);
    let score = 0;
    if (correct) {
      const step = (this.maxScore - 20) / (puzzle.maxGuesses - 1);
      score = Math.round(this.maxScore - (guesses - 1) * step);
    }
    return {
      score,
      correct,
      accuracy: correct ? 1 - (guesses - 1) / puzzle.maxGuesses : 0,
      metadata: { guesses, answer: puzzle.answer },
    };
  },
};
