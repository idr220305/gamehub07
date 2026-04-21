// Pre-generate DailyPuzzle rows for the next N days across all registered games.
// Run with: node src/pregenPuzzles.js [days=100]

import { prisma } from "./db.js";
import { listGames, getGame } from "./games/index.js";
import "./games/index.js";
import { todayUTC, parseDate, formatDate } from "./dates.js";

const DAYS = Number(process.argv[2]) || 100;

async function main() {
  console.log(`🔮 Pre-generating puzzles for the next ${DAYS} days across ${listGames().length} games…`);
  const today = parseDate(todayUTC());

  // Ensure Game rows exist.
  for (const g of listGames()) {
    await prisma.game.upsert({
      where: { id: g.id },
      update: { name: g.name, description: g.description },
      create: { id: g.id, name: g.name, description: g.description },
    });
  }

  let created = 0;
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const date = formatDate(d);
    for (const g of listGames()) {
      const existing = await prisma.dailyPuzzle.findUnique({
        where: { gameId_date: { gameId: g.id, date } },
      });
      if (existing) continue;
      const seed = g.dailySeed(date);
      const puzzle = g.generatePuzzle(seed);
      await prisma.dailyPuzzle.create({
        data: { gameId: g.id, date, seed, puzzle: JSON.stringify(puzzle) },
      });
      created++;
    }
  }
  console.log(`✅ Created ${created} new puzzle rows.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
