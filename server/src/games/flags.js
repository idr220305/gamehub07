import { mulberry32, defaultDailySeed, normText } from "./engine.js";

// SVG flags — stylized, distinctive. Rendered inside a "crop" viewport so only a fragment shows.
// Each flag has alternate accepted answers.
const FLAGS = [
  {
    country: "Japan",
    aliases: ["japan"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#fff"/><circle cx="150" cy="100" r="60" fill="#bc002d"/></svg>`,
  },
  {
    country: "France",
    aliases: ["france"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="100" height="200" fill="#0055a4"/><rect x="100" y="0" width="100" height="200" fill="#fff"/><rect x="200" y="0" width="100" height="200" fill="#ef4135"/></svg>`,
  },
  {
    country: "Germany",
    aliases: ["germany"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect y="0" width="300" height="66" fill="#000"/><rect y="66" width="300" height="67" fill="#dd0000"/><rect y="133" width="300" height="67" fill="#ffce00"/></svg>`,
  },
  {
    country: "Italy",
    aliases: ["italy"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect x="0" width="100" height="200" fill="#009246"/><rect x="100" width="100" height="200" fill="#fff"/><rect x="200" width="100" height="200" fill="#ce2b37"/></svg>`,
  },
  {
    country: "Brazil",
    aliases: ["brazil"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#009c3b"/><polygon points="150,30 270,100 150,170 30,100" fill="#ffdf00"/><circle cx="150" cy="100" r="35" fill="#002776"/></svg>`,
  },
  {
    country: "Canada",
    aliases: ["canada"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect width="75" height="200" fill="#ff0000"/><rect x="75" width="150" height="200" fill="#fff"/><rect x="225" width="75" height="200" fill="#ff0000"/><path d="M150 50 L158 80 L180 70 L170 95 L195 105 L170 115 L180 140 L158 128 L150 160 L142 128 L120 140 L130 115 L105 105 L130 95 L120 70 L142 80 Z" fill="#ff0000"/></svg>`,
  },
  {
    country: "United Kingdom",
    aliases: ["united kingdom", "uk", "britain", "great britain"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#012169"/><path d="M0,0 L300,200 M300,0 L0,200" stroke="#fff" stroke-width="30"/><path d="M0,0 L300,200 M300,0 L0,200" stroke="#c8102e" stroke-width="12"/><rect x="130" width="40" height="200" fill="#fff"/><rect y="80" width="300" height="40" fill="#fff"/><rect x="140" width="20" height="200" fill="#c8102e"/><rect y="90" width="300" height="20" fill="#c8102e"/></svg>`,
  },
  {
    country: "Sweden",
    aliases: ["sweden"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#006aa7"/><rect x="90" width="30" height="200" fill="#fecc00"/><rect y="85" width="300" height="30" fill="#fecc00"/></svg>`,
  },
  {
    country: "Greece",
    aliases: ["greece"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#fff"/><g fill="#0d5eaf"><rect y="0" width="300" height="22"/><rect y="45" width="300" height="22"/><rect y="89" width="300" height="22"/><rect y="133" width="300" height="22"/><rect y="178" width="300" height="22"/><rect x="0" y="0" width="120" height="112" fill="#0d5eaf"/><rect x="45" y="0" width="30" height="112" fill="#fff"/><rect x="0" y="41" width="120" height="30" fill="#fff"/><rect x="45" y="0" width="30" height="112" fill="#0d5eaf"/><rect x="45" y="0" width="30" height="112" fill="#0d5eaf"/><rect x="0" y="41" width="120" height="30" fill="#0d5eaf"/><rect x="45" y="0" width="30" height="112" fill="#0d5eaf"/></g></svg>`,
  },
  {
    country: "South Korea",
    aliases: ["south korea", "korea"],
    svg: `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#fff"/><circle cx="150" cy="100" r="40" fill="#cd2e3a"/><path d="M110 100 A20 20 0 0 1 150 100 A20 20 0 0 0 190 100" fill="#0047a0"/></svg>`,
  },
];

// Random "crop window" — (x, y, size) inside the 300x200 flag viewBox.
// Second stage reveals a larger window.
function cropFor(rng, stage) {
  const size = stage === 0 ? 70 : stage === 1 ? 130 : 300;
  const maxX = 300 - size;
  const maxY = 200 - size;
  const x = Math.floor(rng() * Math.max(1, maxX));
  const y = Math.floor(rng() * Math.max(1, maxY));
  return { x, y, size };
}

const COUNTRY_NAMES = [
  "Japan", "France", "Germany", "Italy", "Brazil", "Canada", "United Kingdom",
  "Sweden", "Greece", "South Korea", "Spain", "Portugal", "Mexico", "Argentina",
  "Australia", "Netherlands", "Norway", "Denmark", "Finland", "Poland", "Ireland",
  "Switzerland", "Austria", "Belgium", "Turkey", "Egypt", "Morocco", "Kenya",
  "South Africa", "Nigeria", "India", "China", "Thailand", "Vietnam", "Indonesia",
  "New Zealand", "United States", "Chile", "Colombia", "Peru",
];

export const flagsGame = {
  id: "flag-fragments",
  name: "Flag Fragments",
  description: "Guess the country from a cropped fragment of its flag.",
  difficulty: "hard",
  maxScore: 100,
  stages: 3,

  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const pick = FLAGS[Math.floor(rng() * FLAGS.length)];
    // Pre-compute two progressively larger crops; stage 2 = full flag.
    const crop1 = cropFor(rng, 0);
    const crop2 = cropFor(rng, 1);
    return {
      country: pick.country,
      aliases: pick.aliases,
      svg: pick.svg,
      crops: [crop1, crop2, { x: 0, y: 0, size: 300 }],
    };
  },

  getPublicPuzzle(puzzle) {
    return { svg: puzzle.svg, crops: puzzle.crops, suggestions: COUNTRY_NAMES };
  },

  validateAnswer(input, puzzle) {
    const n = normText(input);
    return puzzle.aliases.some((a) => normText(a) === n);
  },

  getFeedback(input, puzzle) {
    return { correct: this.validateAnswer(input, puzzle) };
  },

  scoreAnswer(input, puzzle, ctx) {
    const correct = this.validateAnswer(input, puzzle);
    const stage = Math.min(Math.max(0, ctx.stage ?? this.stages - 1), this.stages - 1);
    let score = 0;
    if (correct) {
      score = [100, 60, 30][stage];
    }
    return {
      score,
      correct,
      accuracy: correct ? 1 - stage / this.stages : 0,
      metadata: { stage, answer: puzzle.country },
    };
  },
};
