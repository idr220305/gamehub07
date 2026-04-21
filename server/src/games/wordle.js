import { mulberry32, defaultDailySeed, normText } from "./engine.js";

// Small but varied 5-letter word list.
const WORDS = [
  "APPLE","BRAVE","CRANE","DRIVE","EAGLE","FLAME","GRAPE","HEART","INDEX","JELLY",
  "KNIFE","LEMON","MANGO","NORTH","OCEAN","PIANO","QUEEN","RIVER","STONE","TIGER",
  "ULTRA","VIVID","WATER","XENON","YACHT","ZEBRA","AUDIO","BREAD","CLOUD","DREAM",
  "EMBER","FROST","GHOST","HONEY","IVORY","JOKER","KARMA","LIGHT","MAPLE","NOVEL",
  "OLIVE","PRIDE","QUIET","ROYAL","SPARK","TRAIN","UNITY","VAPOR","WITCH","YEAST",
];

const WORD_LEN = 5;
const MAX_GUESSES = 6;

// Wordle tile coloring — handles duplicate letters correctly.
function tilesFor(guess, answer) {
  const g = guess.toUpperCase().split("");
  const a = answer.toUpperCase().split("");
  const result = Array(WORD_LEN).fill("absent");
  const aCounts = {};
  // First pass: correct positions.
  for (let i = 0; i < WORD_LEN; i++) {
    if (g[i] === a[i]) result[i] = "correct";
    else aCounts[a[i]] = (aCounts[a[i]] || 0) + 1;
  }
  // Second pass: present (in word, wrong position), consuming remaining letter counts.
  for (let i = 0; i < WORD_LEN; i++) {
    if (result[i] === "correct") continue;
    if (aCounts[g[i]] > 0) {
      result[i] = "present";
      aCounts[g[i]]--;
    }
  }
  return result;
}

export const wordleGame = {
  id: "wordle",
  name: "Wordle",
  description: "Guess the 5-letter word in 6 tries. Green = right spot, yellow = wrong spot.",
  difficulty: "medium",
  maxScore: 100,
  wordLen: WORD_LEN,
  maxGuesses: MAX_GUESSES,

  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const answer = WORDS[Math.floor(rng() * WORDS.length)];
    return { answer, wordLen: WORD_LEN, maxGuesses: MAX_GUESSES };
  },

  getPublicPuzzle(puzzle) {
    return { wordLen: puzzle.wordLen, maxGuesses: puzzle.maxGuesses };
  },

  validateAnswer(input, puzzle) {
    // input = array of guesses (strings). Correct if any guess equals the answer.
    if (!Array.isArray(input)) return false;
    return input.some((g) => normText(g).toUpperCase() === puzzle.answer);
  },

  // Feedback for an in-progress game: tile colors for each guess.
  getFeedback(input, puzzle) {
    const guesses = Array.isArray(input) ? input : [];
    const tiles = guesses.slice(0, puzzle.maxGuesses).map((g) => tilesFor(g, puzzle.answer));
    const solved = guesses.some((g) => g.toUpperCase() === puzzle.answer);
    return { tiles, correct: solved };
  },

  scoreAnswer(input, puzzle, ctx) {
    const guesses = Array.isArray(input) ? input.map((x) => String(x).toUpperCase()) : [];
    const solvedIdx = guesses.findIndex((g) => g === puzzle.answer);
    const solved = solvedIdx >= 0;
    let score = 0;
    if (solved) {
      // 1 guess = 100, 2 = 90, 3 = 75, 4 = 60, 5 = 45, 6 = 30.
      const table = [100, 90, 75, 60, 45, 30];
      score = table[solvedIdx] ?? 30;
    }
    return {
      score,
      correct: solved,
      accuracy: solved ? 1 - solvedIdx / puzzle.maxGuesses : 0,
      metadata: {
        answer: puzzle.answer,
        guesses: guesses.length,
        solvedIn: solved ? solvedIdx + 1 : null,
        tiles: guesses.map((g) => tilesFor(g, puzzle.answer)),
      },
    };
  },
};
