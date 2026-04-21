import { mulberry32, defaultDailySeed } from "./engine.js";

// Multiple categories — pick one per day deterministically.

const DATA = {
  population: {
    label: "population (millions)",
    items: [
      { name: "India", emoji: "🇮🇳", stat: 1428 },
      { name: "China", emoji: "🇨🇳", stat: 1412 },
      { name: "United States", emoji: "🇺🇸", stat: 334 },
      { name: "Indonesia", emoji: "🇮🇩", stat: 277 },
      { name: "Pakistan", emoji: "🇵🇰", stat: 240 },
      { name: "Nigeria", emoji: "🇳🇬", stat: 223 },
      { name: "Brazil", emoji: "🇧🇷", stat: 216 },
      { name: "Bangladesh", emoji: "🇧🇩", stat: 172 },
      { name: "Russia", emoji: "🇷🇺", stat: 144 },
      { name: "Mexico", emoji: "🇲🇽", stat: 128 },
      { name: "Japan", emoji: "🇯🇵", stat: 125 },
      { name: "Philippines", emoji: "🇵🇭", stat: 117 },
      { name: "Egypt", emoji: "🇪🇬", stat: 111 },
      { name: "Vietnam", emoji: "🇻🇳", stat: 98 },
      { name: "Germany", emoji: "🇩🇪", stat: 84 },
      { name: "Turkey", emoji: "🇹🇷", stat: 85 },
      { name: "Iran", emoji: "🇮🇷", stat: 89 },
      { name: "Thailand", emoji: "🇹🇭", stat: 71 },
      { name: "United Kingdom", emoji: "🇬🇧", stat: 67 },
      { name: "France", emoji: "🇫🇷", stat: 65 },
      { name: "South Africa", emoji: "🇿🇦", stat: 60 },
      { name: "South Korea", emoji: "🇰🇷", stat: 51 },
      { name: "Argentina", emoji: "🇦🇷", stat: 46 },
      { name: "Canada", emoji: "🇨🇦", stat: 40 },
      { name: "Australia", emoji: "🇦🇺", stat: 26 },
      { name: "Netherlands", emoji: "🇳🇱", stat: 18 },
    ],
  },
  area: {
    label: "area (thousands km²)",
    items: [
      { name: "Russia", emoji: "🇷🇺", stat: 17098 },
      { name: "Canada", emoji: "🇨🇦", stat: 9985 },
      { name: "United States", emoji: "🇺🇸", stat: 9834 },
      { name: "China", emoji: "🇨🇳", stat: 9597 },
      { name: "Brazil", emoji: "🇧🇷", stat: 8516 },
      { name: "Australia", emoji: "🇦🇺", stat: 7692 },
      { name: "India", emoji: "🇮🇳", stat: 3287 },
      { name: "Argentina", emoji: "🇦🇷", stat: 2780 },
      { name: "Algeria", emoji: "🇩🇿", stat: 2382 },
      { name: "Mexico", emoji: "🇲🇽", stat: 1964 },
      { name: "Indonesia", emoji: "🇮🇩", stat: 1904 },
      { name: "Egypt", emoji: "🇪🇬", stat: 1001 },
      { name: "South Africa", emoji: "🇿🇦", stat: 1221 },
      { name: "Turkey", emoji: "🇹🇷", stat: 784 },
      { name: "France", emoji: "🇫🇷", stat: 644 },
      { name: "Thailand", emoji: "🇹🇭", stat: 513 },
      { name: "Spain", emoji: "🇪🇸", stat: 506 },
      { name: "Germany", emoji: "🇩🇪", stat: 358 },
      { name: "Japan", emoji: "🇯🇵", stat: 378 },
      { name: "Italy", emoji: "🇮🇹", stat: 301 },
      { name: "United Kingdom", emoji: "🇬🇧", stat: 243 },
      { name: "Greece", emoji: "🇬🇷", stat: 132 },
      { name: "South Korea", emoji: "🇰🇷", stat: 100 },
      { name: "Netherlands", emoji: "🇳🇱", stat: 42 },
    ],
  },
  movies: {
    label: "release year",
    items: [
      { name: "The Godfather", emoji: "🎬", stat: 1972 },
      { name: "Jaws", emoji: "🦈", stat: 1975 },
      { name: "Star Wars", emoji: "⭐", stat: 1977 },
      { name: "Alien", emoji: "👽", stat: 1979 },
      { name: "E.T.", emoji: "🛸", stat: 1982 },
      { name: "Back to the Future", emoji: "🚗", stat: 1985 },
      { name: "Die Hard", emoji: "🔫", stat: 1988 },
      { name: "Home Alone", emoji: "🏠", stat: 1990 },
      { name: "Jurassic Park", emoji: "🦖", stat: 1993 },
      { name: "Toy Story", emoji: "🤠", stat: 1995 },
      { name: "Titanic", emoji: "🚢", stat: 1997 },
      { name: "The Matrix", emoji: "💊", stat: 1999 },
      { name: "Shrek", emoji: "🧅", stat: 2001 },
      { name: "Finding Nemo", emoji: "🐠", stat: 2003 },
      { name: "Avatar", emoji: "🌳", stat: 2009 },
      { name: "Inception", emoji: "🌀", stat: 2010 },
      { name: "Frozen", emoji: "❄️", stat: 2013 },
      { name: "Interstellar", emoji: "🌌", stat: 2014 },
      { name: "Parasite", emoji: "🏚️", stat: 2019 },
      { name: "Dune", emoji: "🏜️", stat: 2021 },
    ],
  },
  landmarks: {
    label: "height (meters)",
    items: [
      { name: "Burj Khalifa", emoji: "🏙️", stat: 828 },
      { name: "Tokyo Skytree", emoji: "🗼", stat: 634 },
      { name: "Shanghai Tower", emoji: "🏢", stat: 632 },
      { name: "One World Trade Center", emoji: "🏛️", stat: 541 },
      { name: "Petronas Towers", emoji: "🏨", stat: 452 },
      { name: "Empire State Building", emoji: "🗽", stat: 381 },
      { name: "Eiffel Tower", emoji: "🗼", stat: 330 },
      { name: "Chrysler Building", emoji: "🏢", stat: 319 },
      { name: "Great Pyramid of Giza", emoji: "🏺", stat: 147 },
      { name: "Statue of Liberty", emoji: "🗽", stat: 93 },
      { name: "Big Ben Tower", emoji: "🕰️", stat: 96 },
      { name: "Christ the Redeemer", emoji: "🗿", stat: 38 },
      { name: "Stonehenge (tallest stone)", emoji: "🪨", stat: 7 },
    ],
  },
};

const CATEGORY_IDS = Object.keys(DATA);
const ROUNDS = 8;

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const higherLowerGame = {
  id: "higher-lower",
  name: "Higher or Lower",
  description: "Does the next item have a higher or lower value? Build a streak.",
  difficulty: "medium",
  maxScore: 100,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const catId = CATEGORY_IDS[Math.floor(rng() * CATEGORY_IDS.length)];
    const cat = DATA[catId];
    const shuffled = shuffle(rng, cat.items);
    const chain = [];
    for (const c of shuffled) {
      if (chain.length === 0 || chain[chain.length - 1].stat !== c.stat) chain.push(c);
      if (chain.length === ROUNDS + 1) break;
    }
    return {
      category: catId,
      statLabel: cat.label,
      chain,
      rounds: ROUNDS,
    };
  },

  getPublicPuzzle(puzzle) {
    return {
      category: puzzle.category,
      statLabel: puzzle.statLabel,
      rounds: puzzle.rounds,
      chain: puzzle.chain.map((c, i) => ({
        name: c.name, emoji: c.emoji,
        stat: i === 0 ? c.stat : null,
      })),
    };
  },

  validateAnswer(input, puzzle) {
    return Array.isArray(input) && input.length === puzzle.rounds;
  },

  getFeedback(input, puzzle) {
    const arr = Array.isArray(input) ? input : [];
    const rounds = [];
    for (let i = 0; i < arr.length && i < puzzle.rounds; i++) {
      const prev = puzzle.chain[i].stat;
      const next = puzzle.chain[i + 1].stat;
      const expected = next > prev ? "higher" : "lower";
      rounds.push({ correct: arr[i] === expected, expected, actualStat: next });
    }
    return { rounds, correct: rounds.every((r) => r.correct) && rounds.length > 0 };
  },

  // Linear scoring: each correct round = 100/rounds points. No sudden-death.
  scoreAnswer(input, puzzle, ctx) {
    if (!this.validateAnswer(input, puzzle)) {
      return { score: 0, correct: false, accuracy: 0, metadata: { streak: 0 } };
    }
    let bestStreak = 0;
    let curStreak = 0;
    let correctCount = 0;
    const results = [];
    for (let i = 0; i < puzzle.rounds; i++) {
      const prev = puzzle.chain[i].stat;
      const next = puzzle.chain[i + 1].stat;
      const expected = next > prev ? "higher" : "lower";
      const ok = input[i] === expected;
      results.push({ correct: ok, expected, actualStat: next });
      if (ok) { correctCount++; curStreak++; if (curStreak > bestStreak) bestStreak = curStreak; }
      else curStreak = 0;
    }
    const perRound = this.maxScore / puzzle.rounds;
    const score = Math.round(correctCount * perRound);
    return {
      score,
      correct: correctCount === puzzle.rounds,
      accuracy: correctCount / puzzle.rounds,
      metadata: { correctCount, bestStreak, streak: bestStreak, results, fullChain: puzzle.chain, category: puzzle.category },
    };
  },
};
