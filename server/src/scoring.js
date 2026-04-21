// Bonus point calculations applied when computing leaderboards.

import { listGames } from "./games/index.js";

// `totalGames` is the group's active-game count. Fallback: global game count.
export function computeDailyBonuses(subs, totalGames = null) {
  const base = subs.reduce((s, x) => s + x.score, 0);
  const bonuses = [];

  const expected = totalGames ?? listGames().length;
  if (subs.length === expected && expected > 0) {
    bonuses.push({ label: "All games today", points: 20 });
  }

  const maxPossible = subs.reduce((s, x) => s + x.maxScore, 0);
  if (maxPossible > 0) {
    const accuracy = base / maxPossible;
    if (accuracy === 1 && subs.length === expected) {
      bonuses.push({ label: "Perfect run", points: 50 });
    } else if (accuracy >= 0.9 && subs.length >= 2) {
      bonuses.push({ label: "High accuracy (≥90%)", points: 15 });
    }
  }

  const total = base + bonuses.reduce((s, b) => s + b.points, 0);
  return { base, bonuses, total };
}
