import express from "express";
import { prisma } from "../db.js";
import { todayUTC, prevDate, startOfWeekUTC, computeStreak } from "../dates.js";
import { computeDailyBonuses } from "../scoring.js";
import { getDailyDoubleGameId } from "../dailyFeatures.js";
import { gamesForGroup } from "../groupGames.js";

const router = express.Router();

router.get("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const date = req.query.date || todayUTC();
    const yesterday = prevDate(date);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } } },
    });
    if (!group) return res.status(404).json({ error: "group not found" });

    const groupGameCount = gamesForGroup(group, date).length;

    const allSubs = await prisma.submission.findMany({
      where: { groupId },
      orderBy: { date: "desc" },
    });

    const byUser = new Map();
    for (const s of allSubs) {
      if (!byUser.has(s.userId)) byUser.set(s.userId, []);
      byUser.get(s.userId).push(s);
    }

    const weekStart = startOfWeekUTC(date);

    // Per-user rows for `date`.
    const buildRows = (forDate) => {
      return group.members.map((m) => {
        const subs = byUser.get(m.userId) || [];
        const byDate = new Map();
        for (const s of subs) {
          if (!byDate.has(s.date)) byDate.set(s.date, []);
          byDate.get(s.date).push(s);
        }
        const daySubs = byDate.get(forDate) || [];
        const daily = computeDailyBonuses(daySubs, groupGameCount);

        let weeklyTotal = 0;
        let allTimeTotal = 0;
        for (const [d, list] of byDate) {
          const t = computeDailyBonuses(list, groupGameCount).total;
          allTimeTotal += t;
          if (d >= weekStart && d <= forDate) weeklyTotal += t;
        }
        const streak = computeStreak(Array.from(byDate.keys()), forDate);
        return {
          userId: m.userId,
          username: m.user.username,
          displayName: m.user.displayName,
          daily: daily.total,
          dailyBase: daily.base,
          dailyBonuses: daily.bonuses,
          dailyGamesPlayed: daySubs.length,
          weekly: weeklyTotal,
          allTime: allTimeTotal,
          streak,
        };
      });
    };

    const todayRows = buildRows(date);
    const yesterdayRows = buildRows(yesterday);

    // Compute rank delta on the all-time leaderboard between yesterday and today.
    const todayAllTimeSorted = [...todayRows].sort((a, b) => b.allTime - a.allTime);
    const yesterdayAllTimeSorted = [...yesterdayRows].sort((a, b) => b.allTime - a.allTime);
    const rankToday = new Map(todayAllTimeSorted.map((r, i) => [r.userId, i + 1]));
    const rankYesterday = new Map(yesterdayAllTimeSorted.map((r, i) => [r.userId, i + 1]));

    for (const r of todayRows) {
      const today = rankToday.get(r.userId);
      const ystr = rankYesterday.get(r.userId);
      r.rank = today;
      r.rankDelta = ystr != null ? ystr - today : 0; // positive = moved up
    }

    const dailyDetails = {};
    for (const [userId, subs] of byUser) {
      dailyDetails[userId] = {};
      for (const s of subs) {
        if (s.date !== date) continue;
        dailyDetails[userId][s.gameId] = {
          score: s.score,
          maxScore: s.maxScore,
          metadata: JSON.parse(s.metadata),
        };
      }
    }

    res.json({
      date,
      weekStart,
      dailyDouble: getDailyDoubleGameId(date),
      alliancesEnabled: group.alliancesEnabled,
      dailyMode: group.dailyMode,
      daily: [...todayRows].sort((a, b) => b.daily - a.daily),
      weekly: [...todayRows].sort((a, b) => b.weekly - a.weekly),
      allTime: todayAllTimeSorted,
      dailyDetails,
      alliances: await computeAllianceLeaderboard(groupId, todayRows),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

// Compute alliance totals from per-user row data already aggregated above.
async function computeAllianceLeaderboard(groupId, userRows) {
  const alliances = await prisma.alliance.findMany({
    where: { groupId },
    include: { members: true },
  });
  if (alliances.length === 0) return [];
  const userTotals = new Map(userRows.map((r) => [r.userId, r]));
  return alliances.map((a) => {
    const members = a.members.map((m) => userTotals.get(m.userId)).filter(Boolean);
    const daily = members.reduce((s, m) => s + m.daily, 0);
    const weekly = members.reduce((s, m) => s + m.weekly, 0);
    const allTime = members.reduce((s, m) => s + m.allTime, 0);
    const memberCount = members.length;
    return {
      id: a.id,
      name: a.name,
      color: a.color,
      memberCount,
      members: members.map((m) => ({ userId: m.userId, displayName: m.displayName })),
      daily,
      weekly,
      allTime,
      dailyAvg: memberCount > 0 ? Math.round(daily / memberCount) : 0,
      weeklyAvg: memberCount > 0 ? Math.round(weekly / memberCount) : 0,
    };
  }).sort((a, b) => b.weekly - a.weekly);
}

export default router;
