import { mulberry32, defaultDailySeed } from "./engine.js";

// Each puzzle = 4 items, one is the "odd" one with a short explanation.
const PUZZLES = [
  { items: ["🍅 Tomato", "🥒 Cucumber", "🫑 Bell pepper", "🥕 Carrot"], oddIndex: 3, explain: "Carrot is a root; the others are botanically fruits." },
  { items: ["🐋 Whale", "🐬 Dolphin", "🐟 Tuna", "🦭 Seal"], oddIndex: 2, explain: "Tuna is a fish; the rest are mammals." },
  { items: ["🎻 Violin", "🎸 Guitar", "🥁 Drums", "🎹 Piano"], oddIndex: 2, explain: "Drums are percussion; the rest are strings/keys." },
  { items: ["🍷 Merlot", "🥂 Chardonnay", "🍷 Cabernet", "🍷 Pinot Noir"], oddIndex: 1, explain: "Chardonnay is white; the rest are red grapes." },
  { items: ["⚽ Messi", "⚽ Ronaldo", "⚽ Pelé", "🏀 Jordan"], oddIndex: 3, explain: "Jordan played basketball; the rest played football/soccer." },
  { items: ["🐻 Grizzly", "🐻‍❄️ Polar", "🐼 Panda", "🦝 Raccoon"], oddIndex: 3, explain: "Raccoons aren't bears (but pandas are!)." },
  { items: ["💎 Sapphire", "💎 Emerald", "💎 Ruby", "💎 Quartz"], oddIndex: 3, explain: "Quartz isn't one of the Big Four precious stones." },
  { items: ["🐍 Python", "☕ Java", "📄 HTML", "💎 Ruby"], oddIndex: 2, explain: "HTML is a markup language, not a programming language." },
  { items: ["🟧 Saffron", "🟫 Cinnamon", "🧂 Salt", "🌶️ Paprika"], oddIndex: 2, explain: "Salt is a mineral, not a spice." },
  { items: ["🎵 Mozart", "🎵 Beethoven", "🎵 Bach", "🎵 Gershwin"], oddIndex: 3, explain: "Gershwin was 20th-century jazz/pop; the rest are Classical/Baroque." },
  { items: ["🌑 Mercury", "🌕 Venus", "🌍 Earth", "🟠 Mars"], oddIndex: 1, explain: "Venus rotates backward relative to the others." },
  { items: ["🎨 Picasso", "🎨 Dalí", "🎨 Monet", "🎨 Magritte"], oddIndex: 2, explain: "Monet was an Impressionist; the rest were Surrealists/Cubists." },
];

function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const oddOneOutGame = {
  id: "odd-one-out",
  name: "Odd One Out",
  description: "Four items — spot the one that doesn't fit.",
  difficulty: "easy",
  maxScore: 100,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const base = PUZZLES[Math.floor(rng() * PUZZLES.length)];
    // Shuffle so fakeIndex varies each day.
    const indexed = base.items.map((text, i) => ({ text, isOdd: i === base.oddIndex }));
    const shuffled = shuffle(rng, indexed);
    return {
      items: shuffled.map((x) => x.text),
      oddIndex: shuffled.findIndex((x) => x.isOdd),
      explain: base.explain,
    };
  },

  getPublicPuzzle(p) { return { items: p.items }; },

  validateAnswer(input, p) { return Number(input) === p.oddIndex; },
  getFeedback(input, p) { return { correct: this.validateAnswer(input, p), oddIndex: p.oddIndex }; },

  scoreAnswer(input, p, ctx) {
    const correct = this.validateAnswer(input, p);
    return {
      score: correct ? 100 : 0, correct, accuracy: correct ? 1 : 0,
      metadata: { oddIndex: p.oddIndex, explain: p.explain, picked: Number(input) },
    };
  },
};
