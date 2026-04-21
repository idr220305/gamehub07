import { mulberry32, defaultDailySeed } from "./engine.js";

// Each puzzle = 4 themed groups of 4 words. Harder puzzles deliberately
// include words that could plausibly belong to multiple groups.
const PUZZLES = [
  {
    groups: [
      { theme: "Types of stars (astronomy)", color: "yellow", words: ["Giant", "Dwarf", "Pulsar", "Nova"] },
      { theme: "Wrestling moves", color: "green", words: ["Slam", "Pin", "Lock", "Dropkick"] },
      { theme: "Tennis ___", color: "blue", words: ["Racket", "Court", "Match", "Ace"] },
      { theme: "Bowling terms", color: "purple", words: ["Strike", "Spare", "Split", "Gutter"] },
    ],
  },
  {
    groups: [
      { theme: "Things with keys", color: "yellow", words: ["Piano", "Computer", "Map", "Safe"] },
      { theme: "Card game actions", color: "green", words: ["Shuffle", "Deal", "Fold", "Bet"] },
      { theme: "Yoga poses", color: "blue", words: ["Cobra", "Warrior", "Tree", "Bridge"] },
      { theme: "Things that can be broken", color: "purple", words: ["Record", "Silence", "Promise", "Ice"] },
    ],
  },
  {
    groups: [
      { theme: "Coffee drinks", color: "yellow", words: ["Latte", "Mocha", "Americano", "Macchiato"] },
      { theme: "Shades of red", color: "green", words: ["Crimson", "Scarlet", "Ruby", "Burgundy"] },
      { theme: "Shakespeare plays", color: "blue", words: ["Hamlet", "Othello", "Macbeth", "Tempest"] },
      { theme: "___-berry", color: "purple", words: ["Straw", "Blue", "Rasp", "Goose"] },
    ],
  },
  {
    groups: [
      { theme: "Boxing weights", color: "yellow", words: ["Feather", "Welter", "Heavy", "Light"] },
      { theme: "Types of keys (music)", color: "green", words: ["Major", "Minor", "Sharp", "Flat"] },
      { theme: "Poker hands", color: "blue", words: ["Flush", "Straight", "Pair", "Full"] },
      { theme: "Ways to walk", color: "purple", words: ["Stroll", "Amble", "March", "Trudge"] },
    ],
  },
  {
    groups: [
      { theme: "Greek letters", color: "yellow", words: ["Alpha", "Beta", "Gamma", "Delta"] },
      { theme: "Military operations (codename)", color: "green", words: ["Overlord", "Market", "Torch", "Husky"] },
      { theme: "Types of bread", color: "blue", words: ["Sour", "Rye", "Flat", "Corn"] },
      { theme: "___-dough", color: "purple", words: ["Play", "Sour", "Short", "Bread"] },
    ],
  },
];

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const connectionsGame = {
  id: "connections",
  name: "Connections",
  description: "Sort 16 words into 4 hidden themed groups. 4 mistakes max.",
  difficulty: "hard",
  maxScore: 100,
  maxMistakes: 4,

  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const puzzle = PUZZLES[Math.floor(rng() * PUZZLES.length)];
    const allWords = shuffle(rng, puzzle.groups.flatMap((g) => g.words));
    return {
      groups: puzzle.groups, // full answer
      words: allWords,
      maxMistakes: this.maxMistakes,
    };
  },

  getPublicPuzzle(puzzle) {
    return {
      words: puzzle.words,
      maxMistakes: puzzle.maxMistakes,
      groupCount: puzzle.groups.length,
    };
  },

  // A guess is a set of 4 words. Returns which theme (if any) they all belong to.
  _matchTheme(words, puzzle) {
    for (const g of puzzle.groups) {
      if (words.every((w) => g.words.includes(w))) return g;
    }
    return null;
  },

  // input = { guesses: [[w,w,w,w], ...], solved: [themeIndex...] }  (client state)
  validateAnswer(input, puzzle) {
    return !!input && Array.isArray(input.solved) && input.solved.length === puzzle.groups.length;
  },

  // Feedback for a single 4-word guess → { correct, theme?, closeBy? }
  // Called before committing a final result. We also let client submit the final
  // solved/mistakes state for scoring.
  getFeedback(input, puzzle) {
    if (Array.isArray(input) && input.length === 4) {
      const theme = this._matchTheme(input, puzzle);
      if (theme) return { correct: true, theme: theme.theme, color: theme.color };
      // "Close by" = 3 of the 4 belong to one group.
      let closeBy = false;
      for (const g of puzzle.groups) {
        const hits = input.filter((w) => g.words.includes(w)).length;
        if (hits === 3) {
          closeBy = true;
          break;
        }
      }
      return { correct: false, closeBy };
    }
    return { correct: false };
  },

  scoreAnswer(input, puzzle, ctx) {
    // input = { solved: [theme strings], mistakes: number }
    const solved = (input && input.solved) || [];
    const mistakes = Math.min(this.maxMistakes, Math.max(0, (input && input.mistakes) || 0));
    const solvedCount = solved.length;
    // 25 points per solved group, minus 10 per mistake.
    const raw = solvedCount * 25 - mistakes * 10;
    const score = Math.max(0, Math.min(this.maxScore, raw));
    return {
      score,
      correct: solvedCount === puzzle.groups.length,
      accuracy: solvedCount / puzzle.groups.length,
      metadata: {
        solved,
        mistakes,
        fullGroups: puzzle.groups,
      },
    };
  },
};
