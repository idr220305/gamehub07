import { mulberry32, defaultDailySeed } from "./engine.js";

// Simplified Set: cards vary on 3 attributes, each with 3 values.
//   color:  red | green | blue
//   shape:  circle | square | triangle
//   count:  1 | 2 | 3
// A "set" is 3 cards where, for each attribute, values are all same OR all different.
//
// We generate a 9-card grid that contains exactly one unique set, plus extra decoy cards.
// (Finding ALL sets in a full Set board is too complex — we simplify: user picks 3 cards,
// server validates if those 3 form a valid set.)

const COLORS = ["red", "green", "blue"];
const SHAPES = ["circle", "square", "triangle"];
const COUNTS = [1, 2, 3];

function makeCard(c, s, n) {
  return { color: c, shape: s, count: n, id: `${c}-${s}-${n}` };
}

function isSet(cards) {
  if (cards.length !== 3) return false;
  for (const key of ["color", "shape", "count"]) {
    const vals = new Set(cards.map((c) => c[key]));
    if (vals.size !== 1 && vals.size !== 3) return false;
  }
  return true;
}

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Count how many sets exist in a list of cards.
function countSets(cards) {
  let count = 0;
  for (let i = 0; i < cards.length - 2; i++)
    for (let j = i + 1; j < cards.length - 1; j++)
      for (let k = j + 1; k < cards.length; k++)
        if (isSet([cards[i], cards[j], cards[k]])) count++;
  return count;
}

export const setGame = {
  id: "set",
  name: "Set",
  description: "Find a valid set of 3 cards — attributes must all match or all differ.",
  difficulty: "hard",
  maxScore: 100,

  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    // Build full deck of 27 cards, sample until we find a 9-card layout with ≥1 set.
    const deck = [];
    for (const c of COLORS) for (const s of SHAPES) for (const n of COUNTS) deck.push(makeCard(c, s, n));
    let layout;
    for (let attempt = 0; attempt < 30; attempt++) {
      layout = shuffle(rng, deck).slice(0, 9);
      if (countSets(layout) >= 1) break;
    }
    return { cards: layout };
  },

  getPublicPuzzle(puzzle) {
    return { cards: puzzle.cards };
  },

  // input = array of 3 card ids
  validateAnswer(input, puzzle) {
    if (!Array.isArray(input) || input.length !== 3) return false;
    const cards = input.map((id) => puzzle.cards.find((c) => c.id === id)).filter(Boolean);
    if (cards.length !== 3) return false;
    return isSet(cards);
  },

  getFeedback(input, puzzle) {
    return { correct: this.validateAnswer(input, puzzle) };
  },

  scoreAnswer(input, puzzle, ctx) {
    const correct = this.validateAnswer(input, puzzle);
    const attempts = Math.max(1, ctx.attempts || 1);
    const t = Number(ctx.timeTaken) || 0;
    let score = 0;
    if (correct) {
      // Steeper attempt penalty.
      let base = attempts === 1 ? 100 : attempts === 2 ? 70 : attempts === 3 ? 50 : 30;
      // Time penalty after 45s warning.
      if (t > 45000) base = Math.max(20, base - Math.floor((t - 45000) / 1000) * 2);
      score = Math.max(20, Math.min(100, base));
    }
    // Provide an example solution for the summary.
    let exampleSet = null;
    for (let i = 0; i < puzzle.cards.length - 2 && !exampleSet; i++)
      for (let j = i + 1; j < puzzle.cards.length - 1 && !exampleSet; j++)
        for (let k = j + 1; k < puzzle.cards.length && !exampleSet; k++) {
          const trio = [puzzle.cards[i], puzzle.cards[j], puzzle.cards[k]];
          if (isSet(trio)) exampleSet = trio.map((c) => c.id);
        }
    return {
      score,
      correct,
      accuracy: correct ? 1 / attempts : 0,
      metadata: { attempts, exampleSet },
    };
  },
};
