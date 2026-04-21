// Progression system. We don't store XP / achievements in their own table —
// they're derived from existing Submission rows (and Group memberships).
// This keeps the schema unchanged and avoids stale caches.

import { prisma } from "./db.js";
import { computeStreak } from "./dates.js";

// XP from a single submission's score:
// - 1 XP per point earned
// - +25 if perfect (score === maxScore && score > 0)
export function xpForSubmission(score, maxScore) {
  let xp = score || 0;
  if (score > 0 && score === maxScore) xp += 25;
  return xp;
}

const LEVELS = [
  { level: 1, name: "Rookie", min: 0 },
  { level: 2, name: "Player", min: 250 },
  { level: 3, name: "Regular", min: 600 },
  { level: 4, name: "Sharp", min: 1200 },
  { level: 5, name: "Pro", min: 2200 },
  { level: 6, name: "Expert", min: 3500 },
  { level: 7, name: "Master", min: 5500 },
  { level: 8, name: "Grandmaster", min: 8000 },
  { level: 9, name: "Legend", min: 12000 },
  { level: 10, name: "Mythic", min: 18000 },
];

export function levelInfo(xp) {
  let cur = LEVELS[0];
  let next = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) cur = LEVELS[i];
    if (LEVELS[i].min > xp) { next = LEVELS[i]; break; }
  }
  const intoLevel = xp - cur.min;
  const span = next ? next.min - cur.min : 1;
  const pct = next ? Math.min(1, intoLevel / span) : 1;
  return {
    level: cur.level,
    name: cur.name,
    xp,
    xpIntoLevel: intoLevel,
    xpToNext: next ? next.min - xp : 0,
    nextName: next?.name || null,
    progress: pct,
  };
}

// Achievements — each is { id, label, icon, when(stats) -> boolean }.
const ACHIEVEMENTS = [
  { id: "first-win", label: "First Win", icon: "🎯", when: (s) => s.wins >= 1 },
  { id: "perfect-game", label: "Perfect Game", icon: "✨", when: (s) => s.perfects >= 1 },
  { id: "streak-3", label: "3-Day Streak", icon: "🔥", when: (s) => s.bestStreak >= 3 },
  { id: "streak-7", label: "Week Warrior", icon: "🗓️", when: (s) => s.bestStreak >= 7 },
  { id: "streak-30", label: "Month-long", icon: "🏔️", when: (s) => s.bestStreak >= 30 },
  { id: "ten-wins", label: "Ten Wins", icon: "🏅", when: (s) => s.wins >= 10 },
  { id: "fifty-games", label: "50 Games Played", icon: "🎮", when: (s) => s.totalGames >= 50 },
  { id: "perfect-five", label: "Five Perfects", icon: "💎", when: (s) => s.perfects >= 5 },
  { id: "hat-trick", label: "Hat Trick", icon: "🎩", when: (s) => s.maxScoreOneDay >= 3 },
];

export async function computeProgression(userId, groupId = null) {
  const where = { userId };
  if (groupId) where.groupId = groupId;
  const subs = await prisma.submission.findMany({ where });

  let totalXP = 0;
  let totalGames = subs.length;
  let wins = 0;
  let perfects = 0;
  const byDate = new Map();
  const dates = new Set();
  for (const s of subs) {
    totalXP += xpForSubmission(s.score, s.maxScore);
    if (s.score > 0) wins++;
    if (s.score > 0 && s.score === s.maxScore) perfects++;
    dates.add(s.date);
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date).push(s);
  }

  // Best & current streaks.
  const sortedDates = Array.from(dates).sort();
  let bestStreak = 0;
  let run = 0;
  let prev = null;
  for (const d of sortedDates) {
    if (prev) {
      const py = new Date(prev + "T00:00:00Z");
      py.setUTCDate(py.getUTCDate() + 1);
      const expected = py.toISOString().slice(0, 10);
      run = expected === d ? run + 1 : 1;
    } else {
      run = 1;
    }
    if (run > bestStreak) bestStreak = run;
    prev = d;
  }
  const currentStreak = computeStreak(sortedDates);

  // Hat trick: any single date where all submissions were perfect AND ≥3 games.
  let maxScoreOneDay = 0;
  for (const list of byDate.values()) {
    const perfectThatDay = list.filter((s) => s.score > 0 && s.score === s.maxScore).length;
    if (perfectThatDay > maxScoreOneDay) maxScoreOneDay = perfectThatDay;
  }

  const stats = { totalGames, wins, perfects, bestStreak, currentStreak, maxScoreOneDay };
  const earned = ACHIEVEMENTS.filter((a) => a.when(stats));
  const locked = ACHIEVEMENTS.filter((a) => !a.when(stats));

  return {
    xp: totalXP,
    level: levelInfo(totalXP),
    achievements: {
      earned: earned.map(({ id, label, icon }) => ({ id, label, icon })),
      locked: locked.map(({ id, label, icon }) => ({ id, label, icon })),
    },
    stats,
  };
}
