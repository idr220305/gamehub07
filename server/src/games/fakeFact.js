import { mulberry32, defaultDailySeed } from "./engine.js";

// Each puzzle: 3 facts, one is false. fakeIndex points to the fake one.
const FACT_SETS = [
  {
    topic: "Space",
    facts: [
      "A day on Venus is longer than its year.",
      "Neutron stars can spin hundreds of times per second.",
      "Saturn's rings are made mostly of solid rock fragments.", // fake
    ],
    fakeIndex: 2,
    explain: "Saturn's rings are mostly ice, not solid rock.",
  },
  {
    topic: "Animals",
    facts: [
      "Octopuses have three hearts.",
      "A group of flamingos is called a flamboyance.",
      "Sharks are mammals that breathe air.", // fake
    ],
    fakeIndex: 2,
    explain: "Sharks are fish and breathe through gills.",
  },
  {
    topic: "History",
    facts: [
      "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.",
      "Oxford University is older than the Aztec Empire.",
      "The Great Wall of China is visible from the surface of the Moon with the naked eye.", // fake
    ],
    fakeIndex: 2,
    explain: "The Great Wall is not visible from the Moon.",
  },
  {
    topic: "Human body",
    facts: [
      "Your stomach gets a new lining every few days.",
      "Adults have 206 bones.",
      "The human heart stops beating while you sneeze.", // fake
    ],
    fakeIndex: 2,
    explain: "Your heart does not stop when you sneeze.",
  },
  {
    topic: "Geography",
    facts: [
      "Russia spans eleven time zones.",
      "There is a country called Djibouti.",
      "Mount Everest is the tallest mountain on Earth measured from base to peak.", // fake
    ],
    fakeIndex: 2,
    explain: "Measured base-to-peak, Mauna Kea is taller than Everest.",
  },
  {
    topic: "Food",
    facts: [
      "Honey does not spoil.",
      "Bananas are classified as berries, while strawberries are not.",
      "Chocolate was originally drunk as a spicy beverage.",
    ],
    // This one's tricky — all three are true. Flip the fake to be something else:
    fakeIndex: -1,
    explain: "",
  },
  {
    topic: "Food (real)",
    facts: [
      "Carrots were originally purple.",
      "Peanuts are technically legumes, not nuts.",
      "White chocolate contains more cocoa solids than dark chocolate.", // fake
    ],
    fakeIndex: 2,
    explain: "White chocolate contains no cocoa solids at all — just cocoa butter.",
  },
  {
    topic: "Inventions",
    facts: [
      "Bubble wrap was originally invented as wallpaper.",
      "The microwave oven was discovered by accident.",
      "The typewriter was invented in the 20th century.", // fake
    ],
    fakeIndex: 2,
    explain: "The typewriter was invented in the 19th century (1860s-70s).",
  },
];

// Filter out the unusable "all-true" set.
const VALID = FACT_SETS.filter((s) => s.fakeIndex >= 0);

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const fakeFactGame = {
  id: "fake-fact",
  name: "Fake Fact",
  description: "Three facts — one is bogus. Spot the fake.",
  difficulty: "easy",
  maxScore: 100,

  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const set = VALID[Math.floor(rng() * VALID.length)];
    // Shuffle the facts so fakeIndex position varies day to day.
    const indexed = set.facts.map((text, i) => ({ text, isFake: i === set.fakeIndex }));
    const shuffled = shuffle(rng, indexed);
    const fakeIndex = shuffled.findIndex((x) => x.isFake);
    return {
      topic: set.topic,
      facts: shuffled.map((x) => x.text),
      fakeIndex,
      explain: set.explain,
    };
  },

  getPublicPuzzle(puzzle) {
    return { topic: puzzle.topic, facts: puzzle.facts };
  },

  validateAnswer(input, puzzle) {
    return Number(input) === puzzle.fakeIndex;
  },

  getFeedback(input, puzzle) {
    return { correct: this.validateAnswer(input, puzzle), fakeIndex: puzzle.fakeIndex };
  },

  // Time-scaled scoring: full points under 8s, scaled down to 40 at 20s, 0 after 30s.
  scoreAnswer(input, puzzle, ctx) {
    const correct = this.validateAnswer(input, puzzle);
    if (!correct) return {
      score: 0, correct: false, accuracy: 0,
      metadata: { fakeIndex: puzzle.fakeIndex, explain: puzzle.explain, picked: Number(input) },
    };
    const t = Number(ctx.timeTaken) || 0;
    let score = 100;
    if (t <= 8000) score = 100;
    else if (t <= 20000) score = Math.round(100 - ((t - 8000) / 12000) * 60);
    else if (t <= 30000) score = Math.round(40 - ((t - 20000) / 10000) * 40);
    else score = 0;
    return {
      score, correct: score > 0, accuracy: score / 100,
      metadata: { fakeIndex: puzzle.fakeIndex, explain: puzzle.explain, picked: Number(input), timeMs: t },
    };
  },
};
