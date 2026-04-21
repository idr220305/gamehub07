import { mulberry32, defaultDailySeed } from "./engine.js";

const EVENTS = [
  { text: "Humans first walk on the Moon", year: 1969 },
  { text: "The Berlin Wall falls", year: 1989 },
  { text: "The World Wide Web is released to the public", year: 1991 },
  { text: "The first iPhone is released", year: 2007 },
  { text: "The Titanic sinks on its maiden voyage", year: 1912 },
  { text: "Wright brothers' first powered flight", year: 1903 },
  { text: "The Chernobyl nuclear disaster", year: 1986 },
  { text: "The US Declaration of Independence is signed", year: 1776 },
  { text: "Einstein publishes general relativity", year: 1915 },
  { text: "The Maastricht Treaty establishes the EU", year: 1993 },
  { text: "The French Revolution begins", year: 1789 },
  { text: "The first modern Olympic Games in Athens", year: 1896 },
  { text: "The Hubble Space Telescope launches", year: 1990 },
  { text: "The Soviet Union dissolves", year: 1991 },
  { text: "The first Star Wars film is released", year: 1977 },
  { text: "Gutenberg's printing press (approx.)", year: 1440 },
  { text: "The first successful heart transplant", year: 1967 },
  { text: "The RMS Lusitania is sunk", year: 1915 },
  { text: "The invention of the telephone (Bell)", year: 1876 },
  { text: "The Wall Street Crash", year: 1929 },
  { text: "Facebook founded", year: 2004 },
  { text: "YouTube founded", year: 2005 },
  { text: "Bitcoin whitepaper published", year: 2008 },
  { text: "Nelson Mandela released from prison", year: 1990 },
  { text: "Human Genome Project completed (draft)", year: 2000 },
  { text: "First Harry Potter book published", year: 1997 },
  { text: "Apollo 13 mission", year: 1970 },
  { text: "The Suez Canal opens", year: 1869 },
  { text: "Women gain the vote in the US (19th Amendment)", year: 1920 },
  { text: "The iPad is released", year: 2010 },
];

export const whichFirstGame = {
  id: "which-first",
  name: "Which Came First?",
  description: "Two historical events — pick the one that happened earlier.",
  difficulty: "medium",
  maxScore: 100,

  dailySeed(date) { return defaultDailySeed(this.id, date); },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    // Pick two events with a meaningful year gap.
    let a, b, tries = 0;
    do {
      a = EVENTS[Math.floor(rng() * EVENTS.length)];
      b = EVENTS[Math.floor(rng() * EVENTS.length)];
      tries++;
    } while ((a === b || Math.abs(a.year - b.year) < 5) && tries < 40);
    // Randomize display order so the earlier one isn't always on the left.
    const swap = rng() < 0.5;
    const left = swap ? b : a;
    const right = swap ? a : b;
    return {
      left: { text: left.text, year: left.year },
      right: { text: right.text, year: right.year },
      earlierSide: left.year <= right.year ? "left" : "right",
    };
  },

  getPublicPuzzle(p) {
    return { left: { text: p.left.text }, right: { text: p.right.text } };
  },

  validateAnswer(input, p) { return input === "left" || input === "right"; },

  getFeedback(input, p) {
    const correct = input === p.earlierSide;
    return {
      correct,
      earlierSide: p.earlierSide,
      leftYear: p.left.year,
      rightYear: p.right.year,
    };
  },

  scoreAnswer(input, p, ctx) {
    const correct = input === p.earlierSide;
    const t = Number(ctx.timeTaken) || 8000;
    let score = 0;
    if (correct) score = t < 4000 ? 100 : t < 10000 ? 80 : 60;
    return {
      score, correct, accuracy: correct ? 1 : 0,
      metadata: {
        earlierSide: p.earlierSide,
        leftYear: p.left.year,
        rightYear: p.right.year,
        picked: input,
      },
    };
  },
};
