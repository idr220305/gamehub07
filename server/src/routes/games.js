import express from "express";
import { prisma } from "../db.js";
import { listGames, getGame, normalizeScore } from "../games/index.js";
import { todayUTC, prevDate } from "../dates.js";
import { getDailyDoubleGameId } from "../dailyFeatures.js";
import { computeProgression, xpForSubmission } from "../progression.js";
import { gamesForGroup } from "../groupGames.js";

const router = express.Router();

function gameInfo(g) {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    maxScore: g.maxScore,
    difficulty: g.difficulty || "medium",
  };
}

router.get("/", (_req, res) => {
  res.json(listGames().map(gameInfo));
});

async function getOrCreateDailyPuzzle(gameId, date) {
  const existing = await prisma.dailyPuzzle.findUnique({
    where: { gameId_date: { gameId, date } },
  });
  if (existing) return { ...existing, puzzle: JSON.parse(existing.puzzle) };
  const game = getGame(gameId);
  if (!game) throw new Error(`Unknown game: ${gameId}`);
  const seed = game.dailySeed(date);
  const puzzle = game.generatePuzzle(seed);
  await prisma.game.upsert({
    where: { id: game.id },
    update: { name: game.name, description: game.description },
    create: { id: game.id, name: game.name, description: game.description },
  });
  const row = await prisma.dailyPuzzle.create({
    data: { gameId, date, seed, puzzle: JSON.stringify(puzzle) },
  });
  return { ...row, puzzle };
}

router.get("/daily", async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    const date = req.query.date || todayUTC();
    if (!userId || !groupId) return res.status(400).json({ error: "userId and groupId required" });

    const existingSubs = await prisma.submission.findMany({ where: { userId, groupId, date } });
    const subByGame = new Map(existingSubs.map((s) => [s.gameId, s]));

    // Also fetch cross-group submissions for this user+date so we can show them as completed.
    const crossGroupSubs = await prisma.submission.findMany({
      where: { userId, date, NOT: { groupId } },
    });
    const crossByGame = new Map();
    for (const s of crossGroupSubs) {
      // Prefer the earliest one (in case of multiple).
      if (!crossByGame.has(s.gameId)) crossByGame.set(s.gameId, s);
    }

    const dailyDouble = getDailyDoubleGameId(date);

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    const groupGames = gamesForGroup(group, date);

    const result = [];
    for (const g of groupGames) {
      const dp = await getOrCreateDailyPuzzle(g.id, date);
      const sub = subByGame.get(g.id);
      const cross = !sub ? crossByGame.get(g.id) : null;
      result.push({
        ...gameInfo(g),
        publicPuzzle: g.getPublicPuzzle(dp.puzzle),
        submitted: !!sub || !!cross,
        playedElsewhere: !sub && !!cross,
        isDailyDouble: g.id === dailyDouble,
        submission: sub
          ? {
              score: sub.score,
              maxScore: sub.maxScore,
              timeTaken: sub.timeTaken,
              metadata: JSON.parse(sub.metadata),
              createdAt: sub.createdAt,
            }
          : cross
          ? {
              score: cross.score,
              maxScore: cross.maxScore,
              timeTaken: cross.timeTaken,
              metadata: JSON.parse(cross.metadata),
              createdAt: cross.createdAt,
              fromOtherGroup: true,
            }
          : null,
      });
    }
    res.json({ date, dailyDouble, games: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load daily games" });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const { gameId, input } = req.body || {};
    const date = req.body.date || todayUTC();
    if (!gameId) return res.status(400).json({ error: "gameId required" });
    const game = getGame(gameId);
    if (!game) return res.status(404).json({ error: "Unknown game" });
    if (typeof game.getFeedback !== "function") {
      return res.json({ feedback: null });
    }
    const dp = await getOrCreateDailyPuzzle(gameId, date);
    res.json({ feedback: game.getFeedback(input, dp.puzzle) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to compute feedback" });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { userId, groupId, gameId, input, timeTaken, clientCtx } = req.body || {};
    if (!userId || !groupId || !gameId) {
      return res.status(400).json({ error: "userId, groupId, gameId required" });
    }
    const date = req.body.date || todayUTC();

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) return res.status(403).json({ error: "Not a member of this group" });

    const existing = await prisma.submission.findUnique({
      where: { userId_gameId_groupId_date: { userId, gameId, groupId, date } },
    });
    if (existing) return res.status(409).json({ error: "Already submitted", submission: existing });

    // Global once-per-day: if the user already played this game today in ANY group,
    // mirror that submission into this group at the same score (no re-play).
    const globalExisting = await prisma.submission.findFirst({
      where: { userId, gameId, date },
      orderBy: { createdAt: "asc" },
    });
    if (globalExisting) {
      const mirrored = await prisma.submission.create({
        data: {
          userId,
          gameId,
          groupId,
          date,
          score: globalExisting.score,
          maxScore: globalExisting.maxScore,
          timeTaken: globalExisting.timeTaken,
          metadata: globalExisting.metadata,
        },
      });
      return res.status(200).json({
        submission: { ...mirrored, metadata: JSON.parse(mirrored.metadata || "{}") },
        result: {
          score: mirrored.score,
          correct: mirrored.score > 0,
          accuracy: mirrored.maxScore > 0 ? mirrored.score / mirrored.maxScore : 0,
          timeTaken: mirrored.timeTaken,
          metadata: JSON.parse(mirrored.metadata || "{}"),
        },
        stats: { mirrored: true, rank: null, submittersInGroup: 0, membersInGroup: 0, groupCorrectPct: 0, xpEarned: 0 },
      });
    }

    const game = getGame(gameId);
    if (!game) return res.status(404).json({ error: "Unknown game" });

    const dp = await getOrCreateDailyPuzzle(gameId, date);
    const ctx = { timeTaken: Number(timeTaken) || 0, ...(clientCtx || {}) };
    const raw = game.scoreAnswer(input, dp.puzzle, ctx);
    const result = normalizeScore(raw, game.maxScore, ctx);

    // Apply daily double multiplier at storage time so leaderboard math stays simple.
    const dailyDouble = getDailyDoubleGameId(date);
    const isDouble = dailyDouble === gameId;
    const finalScore = isDouble ? result.score * 2 : result.score;
    const finalMaxScore = isDouble ? game.maxScore * 2 : game.maxScore;

    const submission = await prisma.submission.create({
      data: {
        userId,
        gameId,
        groupId,
        date,
        score: finalScore,
        maxScore: finalMaxScore,
        timeTaken: result.timeTaken,
        metadata: JSON.stringify({ ...result.metadata, doubled: isDouble }),
      },
    });

    // Stats for the post-game card.
    const allForGameToday = await prisma.submission.findMany({ where: { groupId, gameId, date } });
    const memberCount = await prisma.groupMember.count({ where: { groupId } });
    const sorted = [...allForGameToday].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex((s) => s.id === submission.id) + 1;
    const correctCount = allForGameToday.filter((s) => s.score > 0).length;
    const groupCorrectPct = memberCount > 0 ? Math.round((correctCount / memberCount) * 100) : 0;

    // Rival info — points needed to overtake the next player up on today's leaderboard.
    const todaySubsAll = await prisma.submission.findMany({ where: { groupId, date } });
    const dailyTotals = new Map();
    for (const s of todaySubsAll) {
      dailyTotals.set(s.userId, (dailyTotals.get(s.userId) || 0) + s.score);
    }
    const sortedTotals = [...dailyTotals.entries()].sort((a, b) => b[1] - a[1]);
    const myDailyTotal = dailyTotals.get(userId) || 0;
    const myIdx = sortedTotals.findIndex(([uid]) => uid === userId);
    let rival = null;
    if (myIdx > 0) {
      const [rivalId, rivalScore] = sortedTotals[myIdx - 1];
      const rivalUser = await prisma.user.findUnique({ where: { id: rivalId } });
      if (rivalUser) {
        rival = {
          displayName: rivalUser.displayName,
          gap: rivalScore - myDailyTotal,
        };
      }
    }

    const xpEarned = xpForSubmission(finalScore, finalMaxScore);

    res.json({
      submission: { ...submission, metadata: { ...result.metadata, doubled: isDouble } },
      result,
      stats: {
        rank,
        submittersInGroup: allForGameToday.length,
        membersInGroup: memberCount,
        groupCorrectPct,
        doubled: isDouble,
        xpEarned,
        rival,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to submit" });
  }
});

// Personal stats across all groups the user belongs to (or scoped to a group).
// Personal stats across all groups the user belongs to (or scoped to a group).
router.get("/progression/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const groupId = req.query.groupId || null;
    const data = await computeProgression(userId, groupId);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load progression" });
  }
});

router.get("/stats/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { groupId } = req.query;
    const where = { userId };
    if (groupId) where.groupId = groupId;
    const subs = await prisma.submission.findMany({ where });
    if (subs.length === 0) {
      return res.json({
        totalGames: 0, totalScore: 0, avgScore: 0, accuracy: 0, bestStreak: 0,
        currentStreak: 0, perGame: {}, daysPlayed: 0,
      });
    }
    const totalGames = subs.length;
    const totalScore = subs.reduce((s, x) => s + x.score, 0);
    const totalMax = subs.reduce((s, x) => s + x.maxScore, 0);
    const avgScore = Math.round(totalScore / totalGames);
    const accuracy = totalMax > 0 ? totalScore / totalMax : 0;
    const correctCount = subs.filter((s) => s.score > 0).length;
    const correctRate = correctCount / totalGames;

    // Streaks computed from unique dates.
    const dates = Array.from(new Set(subs.map((s) => s.date))).sort();
    const dateSet = new Set(dates);
    let bestStreak = 0;
    let curRun = 0;
    let prev = null;
    for (const d of dates) {
      if (prev && prevDate(d) === prev) curRun++;
      else curRun = 1;
      if (curRun > bestStreak) bestStreak = curRun;
      prev = d;
    }
    // Current streak ends at today if played, else stops at last play day if it was yesterday.
    const today = todayUTC();
    let cursor = dateSet.has(today) ? today : prevDate(today);
    let currentStreak = 0;
    while (dateSet.has(cursor)) { currentStreak++; cursor = prevDate(cursor); }

    // Per-game breakdown.
    const perGame = {};
    for (const s of subs) {
      const g = (perGame[s.gameId] ||= { plays: 0, score: 0, max: 0, best: 0 });
      g.plays++;
      g.score += s.score;
      g.max += s.maxScore;
      if (s.score > g.best) g.best = s.score;
    }
    for (const id of Object.keys(perGame)) {
      const g = perGame[id];
      g.avg = Math.round(g.score / g.plays);
      g.accuracy = g.max > 0 ? g.score / g.max : 0;
    }

    res.json({
      totalGames, totalScore, avgScore, accuracy, correctRate,
      bestStreak, currentStreak,
      daysPlayed: dates.length,
      perGame,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

// Recent activity feed for a group — last N submissions, with user/game info.
router.get("/activity/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 20));
    const subs = await prisma.submission.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: true, game: true },
    });
    res.json(
      subs.map((s) => ({
        id: s.id,
        userId: s.userId,
        username: s.user.username,
        displayName: s.user.displayName,
        gameId: s.gameId,
        gameName: s.game.name,
        score: s.score,
        maxScore: s.maxScore,
        date: s.date,
        createdAt: s.createdAt,
      }))
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load activity" });
  }
});

export default router;
