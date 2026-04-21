// Deterministic per-day "daily double" — one game today gets 2x score.
// Uses the same seeded RNG style as the games themselves so it's stable for the date.

import { mulberry32, listGames } from "./games/index.js";

export function getDailyDoubleGameId(date) {
  const games = listGames();
  if (games.length === 0) return null;
  const rng = mulberry32(`daily-double::${date}`);
  return games[Math.floor(rng() * games.length)].id;
}

// Apply the multiplier to a raw submission's score.
export function applyDailyDouble(submission, dailyDoubleGameId) {
  if (!submission || submission.gameId !== dailyDoubleGameId) return submission.score;
  return submission.score * 2;
}
