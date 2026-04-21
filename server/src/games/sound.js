import { mulberry32, defaultDailySeed, normText } from "./engine.js";

// Each item = a recognizable short musical phrase, expressed as notes the client plays with WebAudio.
// Notes in scientific pitch notation; durations in seconds.
// We keep the phrases short (6-10 notes) and iconic.
const PHRASES = [
  {
    answer: "Happy Birthday",
    aliases: ["happy birthday", "happy birthday to you"],
    // Melody simplified — opening of Happy Birthday in C.
    notes: [
      ["C4", 0.3], ["C4", 0.2], ["D4", 0.5], ["C4", 0.5], ["F4", 0.5], ["E4", 0.8],
      ["C4", 0.3], ["C4", 0.2], ["D4", 0.5], ["C4", 0.5], ["G4", 0.5], ["F4", 0.8],
    ],
  },
  {
    answer: "Twinkle Twinkle Little Star",
    aliases: ["twinkle twinkle little star", "twinkle twinkle", "twinkle"],
    notes: [
      ["C4", 0.4], ["C4", 0.4], ["G4", 0.4], ["G4", 0.4],
      ["A4", 0.4], ["A4", 0.4], ["G4", 0.8],
      ["F4", 0.4], ["F4", 0.4], ["E4", 0.4], ["E4", 0.4], ["D4", 0.4], ["D4", 0.4], ["C4", 0.8],
    ],
  },
  {
    answer: "Ode to Joy",
    aliases: ["ode to joy", "beethoven ode to joy"],
    notes: [
      ["E4", 0.4], ["E4", 0.4], ["F4", 0.4], ["G4", 0.4],
      ["G4", 0.4], ["F4", 0.4], ["E4", 0.4], ["D4", 0.4],
      ["C4", 0.4], ["C4", 0.4], ["D4", 0.4], ["E4", 0.4],
      ["E4", 0.6], ["D4", 0.2], ["D4", 0.8],
    ],
  },
  {
    answer: "Mary Had a Little Lamb",
    aliases: ["mary had a little lamb", "mary had a lamb"],
    notes: [
      ["E4", 0.4], ["D4", 0.4], ["C4", 0.4], ["D4", 0.4],
      ["E4", 0.4], ["E4", 0.4], ["E4", 0.8],
      ["D4", 0.4], ["D4", 0.4], ["D4", 0.8],
      ["E4", 0.4], ["G4", 0.4], ["G4", 0.8],
    ],
  },
  {
    answer: "Jingle Bells",
    aliases: ["jingle bells"],
    notes: [
      ["E4", 0.3], ["E4", 0.3], ["E4", 0.6],
      ["E4", 0.3], ["E4", 0.3], ["E4", 0.6],
      ["E4", 0.3], ["G4", 0.3], ["C4", 0.4], ["D4", 0.3], ["E4", 0.8],
    ],
  },
  {
    answer: "Row Row Row Your Boat",
    aliases: ["row row row your boat", "row your boat"],
    notes: [
      ["C4", 0.4], ["C4", 0.4], ["C4", 0.3], ["D4", 0.2], ["E4", 0.8],
      ["E4", 0.3], ["D4", 0.2], ["E4", 0.3], ["F4", 0.2], ["G4", 1.0],
    ],
  },
];

export const soundGame = {
  id: "sound-guess",
  name: "Sound Guess",
  description: "Press play, listen to the tune, name the song.",
  difficulty: "hard",
  maxScore: 100,
  maxPlays: 3,

  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    const pick = PHRASES[Math.floor(rng() * PHRASES.length)];
    return { answer: pick.answer, aliases: pick.aliases, notes: pick.notes };
  },

  getPublicPuzzle(puzzle) {
    return { notes: puzzle.notes, maxPlays: this.maxPlays, suggestions: PHRASES.map((p) => p.answer) };
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
    const plays = Math.max(1, Math.min(this.maxPlays, ctx.plays || 1));
    let score = 0;
    if (correct) {
      // 1 play = 100, 2 = 70, 3 = 40.
      score = [100, 70, 40][plays - 1] || 40;
    }
    return {
      score,
      correct,
      accuracy: correct ? 1 / plays : 0,
      metadata: { answer: puzzle.answer, plays },
    };
  },
};
