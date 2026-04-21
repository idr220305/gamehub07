// Game Engine
// ------------------------------------------------------------
// Every game implements:
//   id, name, description, maxScore
//   dailySeed(date)
//   generatePuzzle(seed)
//   getPublicPuzzle(puzzle)
//   validateAnswer(input, puzzle)
//   scoreAnswer(input, puzzle, ctx) -> { score, correct, accuracy?, metadata }
//
// NEW:
//   getFeedback(input, puzzle) -> game-specific structured feedback for the UI,
//       e.g. per-letter Wordle tiles, per-round Higher/Lower correctness, etc.
//       Called by the /feedback endpoint so the UI can render green/red states
//       BEFORE the final submission is locked.

const registry = new Map();

export function registerGame(game) {
  if (!game.id) throw new Error("Game must have an id");
  if (registry.has(game.id)) {
    console.warn(`Game ${game.id} already registered, overwriting.`);
  }
  registry.set(game.id, game);
}

export function getGame(id) {
  return registry.get(id);
}

export function listGames() {
  return Array.from(registry.values());
}

// -------- Deterministic seeded RNG (mulberry32) --------
export function hashStringToSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = typeof seed === "number" ? seed : hashStringToSeed(String(seed));
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sample(rng, arr, n) {
  const pool = [...arr];
  const picked = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultDailySeed(gameId, date) {
  return `${gameId}::${date}`;
}

// Normalize a scoreAnswer return into the standardized shape.
// Games may return { score, correct, metadata } (old) or the full shape.
export function normalizeScore(result, maxScore, ctx = {}) {
  const score = Math.max(0, Math.min(maxScore, Math.round(result.score || 0)));
  const accuracy =
    result.accuracy != null
      ? Math.max(0, Math.min(1, result.accuracy))
      : maxScore > 0
      ? score / maxScore
      : 0;
  return {
    score,
    correct: !!result.correct,
    accuracy,
    timeTaken: Number(ctx.timeTaken) || 0,
    metadata: result.metadata || {},
  };
}

// Difficulty levels — used by the UI for badges. Free-form, but standardized.
export const DIFFICULTY = { EASY: "easy", MEDIUM: "medium", HARD: "hard" };

// Normalized text comparison helper used by several games.
export function normText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Small Levenshtein — enough for short strings. Returns edit distance.
export function editDistance(a, b) {
  a = String(a); b = String(b);
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length, n = b.length;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

// Fuzzy equality for short answers: exact normalized match OR small edit distance.
// Tolerance scales with length: 1 edit for ≤6 chars, 2 edits for ≤12, 3 otherwise.
export function fuzzyEqual(input, target) {
  const a = normText(input);
  const b = normText(target);
  if (!a || !b) return false;
  if (a === b) return true;
  const tol = b.length <= 6 ? 1 : b.length <= 12 ? 2 : 3;
  return editDistance(a, b) <= tol;
}
