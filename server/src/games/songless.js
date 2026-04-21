import { mulberry32, defaultDailySeed, normText } from "./engine.js";

// Original short lyric paraphrases — not copied from actual songs.
// Each entry has two progressively more revealing hints and the song title.
const SONGS = [
  { hints: ["A sparkling celestial object, modest and low…", "…a traveler wonders aloud what you could possibly be."], answer: "Twinkle Twinkle Little Star" },
  { hints: ["A boy on a farm is introduced as the owner…", "…and each of his animals is named with a sound."], answer: "Old MacDonald" },
  { hints: ["A rowing instruction repeated several times…", "…with a reminder that life itself might be imaginary."], answer: "Row Row Row Your Boat" },
  { hints: ["An arachnid ascends a drainage pipe…", "…weather thwarts the climb, but it tries again."], answer: "Itsy Bitsy Spider" },
  { hints: ["A juvenile sheep is the constant companion of a schoolchild…", "…whose fleece is whiter than average."], answer: "Mary Had a Little Lamb" },
  { hints: ["Two hand motions describe a star, a tree, and a river…", "…the alphabet shares its melody with this one."], answer: "ABC Song" },
  { hints: ["A traveler asks about a muffin vendor's whereabouts…", "…said vendor lives on a specific lane."], answer: "The Muffin Man" },
  { hints: ["A natal day greeting is sung twice to the same person…", "…their name is inserted in the third line."], answer: "Happy Birthday" },
  { hints: ["A bridge is deteriorating structurally…", "…a woman named loosely is addressed throughout."], answer: "London Bridge" },
  { hints: ["Sailors sing about spotting a drunken crewmate in the morning…", "…suggestions for punishment follow."], answer: "Drunken Sailor" },
];

export const songlessGame = {
  id: "songless",
  name: "Melody Riddle",
  description: "Guess the tune from a cryptic hint. A second hint costs points.",
  difficulty: "medium",
  maxScore: 100,

  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const pick = SONGS[Math.floor(rng() * SONGS.length)];
    return { hints: pick.hints, answer: pick.answer };
  },

  getPublicPuzzle(puzzle) {
    return { hints: puzzle.hints, suggestions: SONGS.map((s) => s.answer) };
  },

  validateAnswer(input, puzzle) {
    return normText(input) === normText(puzzle.answer);
  },

  getFeedback(input, puzzle) {
    return { correct: this.validateAnswer(input, puzzle) };
  },

  scoreAnswer(input, puzzle, ctx) {
    const correct = this.validateAnswer(input, puzzle);
    // hintsUsed: 1 or 2 (at least 1 because first hint is always shown).
    const hintsUsed = Math.max(1, Math.min(2, ctx.hintsUsed || 1));
    // guesses used, soft-penalized.
    const guesses = Math.max(1, ctx.guesses || 1);
    let score = 0;
    if (correct) {
      // 1 hint = 100 base, 2 hints = 60 base. Minus 5 per extra guess beyond first.
      const base = hintsUsed === 1 ? 100 : 60;
      score = Math.max(20, base - (guesses - 1) * 5);
    }
    return {
      score,
      correct,
      accuracy: correct ? (hintsUsed === 1 ? 1 : 0.6) : 0,
      metadata: { answer: puzzle.answer, hintsUsed, guesses },
    };
  },
};
