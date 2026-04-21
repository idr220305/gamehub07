// Seed demo data:
// - 4 users, 1 group "Demo Crew" with invite code DEMO01
// - a few days of historical submissions across ALL 12 games so the leaderboard has depth

import { prisma } from "./db.js";
import { listGames, getGame } from "./games/index.js";
import "./games/index.js";
import { todayUTC, parseDate, formatDate } from "./dates.js";
import { gamesForGroup } from "./groupGames.js";

function daysAgo(n) {
  const d = parseDate(todayUTC());
  d.setUTCDate(d.getUTCDate() - n);
  return formatDate(d);
}

async function main() {
  console.log("🌱 Seeding database…");

  // Ensure game rows exist.
  for (const g of listGames()) {
    await prisma.game.upsert({
      where: { id: g.id },
      update: { name: g.name, description: g.description },
      create: { id: g.id, name: g.name, description: g.description },
    });
  }

  const users = [];
  for (const [username, displayName] of [
    ["alice", "Alice"],
    ["bob", "Bob"],
    ["carol", "Carol"],
    ["dave", "Dave"],
  ]) {
    const u = await prisma.user.upsert({
      where: { username },
      update: { displayName },
      create: { username, displayName },
    });
    users.push(u);
  }

  const group = await prisma.group.upsert({
    where: { inviteCode: "DEMO01" },
    update: {
      name: "Demo Crew",
      createdByUserId: users[0].id,
      selectedGames: JSON.stringify(["wordle", "emoji", "higher-lower", "which-first", "true-false"]),
    },
    create: {
      name: "Demo Crew",
      inviteCode: "DEMO01",
      createdByUserId: users[0].id,
      selectedGames: JSON.stringify(["wordle", "emoji", "higher-lower", "which-first", "true-false"]),
    },
  });

  for (const u of users) {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId: u.id, groupId: group.id } },
      update: {},
      create: { userId: u.id, groupId: group.id },
    });
  }

  const dates = [daysAgo(3), daysAgo(2), daysAgo(1), todayUTC()];

  // Cache puzzles.
  for (const date of dates) {
    for (const g of listGames()) {
      const existing = await prisma.dailyPuzzle.findUnique({
        where: { gameId_date: { gameId: g.id, date } },
      });
      if (!existing) {
        const seed = g.dailySeed(date);
        const puzzle = g.generatePuzzle(seed);
        await prisma.dailyPuzzle.create({
          data: { gameId: g.id, date, seed, puzzle: JSON.stringify(puzzle) },
        });
      }
    }
  }

  // Wipe previous demo submissions so re-seeding is idempotent.
  await prisma.submission.deleteMany({ where: { groupId: group.id } });

  // Per-user skill profile — chance they succeed + avg score when they do.
  const profile = {
    alice: { pSucceed: 0.85, avg: 82 },
    bob:   { pSucceed: 0.70, avg: 68 },
    carol: { pSucceed: 0.90, avg: 88 },
    dave:  { pSucceed: 0.55, avg: 55 },
  };

  // Deterministic pseudo-random so seed runs are stable.
  let rngState = 1;
  const rng = () => {
    rngState = (rngState * 1664525 + 1013904223) & 0xffffffff;
    return ((rngState >>> 0) % 10000) / 10000;
  };

  const groupGames = gamesForGroup(group);

  for (const u of users) {
    const p = profile[u.username];
    for (let i = 0; i < dates.length - 1; i++) { // skip today — users haven't played today
      const date = dates[i];
      for (const g of groupGames) {
        // Each user has a small chance of skipping a game on any given day.
        if (rng() > 0.85) continue;
        const succeeded = rng() < p.pSucceed;
        let score = 0;
        if (succeeded) {
          // Jitter around their average.
          const jitter = (rng() - 0.5) * 30;
          score = Math.max(10, Math.min(g.maxScore, Math.round(p.avg + jitter)));
        } else {
          // Partial credit for some games that allow it (higher-lower, connections, draw, year).
          const partial = ["higher-lower", "connections", "precision-draw", "which-first"];
          if (partial.includes(g.id)) {
            score = Math.round(rng() * 40);
          } else {
            score = 0;
          }
        }
        await prisma.submission.create({
          data: {
            userId: u.id,
            groupId: group.id,
            gameId: g.id,
            date,
            score,
            maxScore: g.maxScore,
            timeTaken: 15_000 + Math.floor(rng() * 40_000),
            metadata: JSON.stringify({ seeded: true }),
          },
        });
      }
    }
  }

  console.log("✅ Seed complete.");
  console.log(`   Games registered: ${listGames().length}`);
  console.log(`   Users: ${users.map((u) => u.username).join(", ")}`);
  console.log("   Group: Demo Crew   Invite code: DEMO01");
  console.log("   Try signing in as 'alice' and joining with code 'DEMO01'.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
