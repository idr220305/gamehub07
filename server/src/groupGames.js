// Helpers for the per-group game selection.

import { listGames, getGame, mulberry32 } from "./games/index.js";

export const MIN_SELECTED = 1;
export const MAX_SELECTED = Infinity;
export const DEFAULT_SELECTED = 5; // When a group is created without picking.

export function parseSelected(group) {
  if (!group?.selectedGames) return null;
  try {
    const arr = JSON.parse(group.selectedGames);
    if (!Array.isArray(arr)) return null;
    // Filter to currently-registered games.
    return arr.filter((id) => !!getGame(id));
  } catch {
    return null;
  }
}

// Returns the list of game objects this group plays ON A GIVEN DATE.
// When `dailyMode === "random"`, a deterministic per-date subset of `dailyPoolSize`
// games is chosen from the group's selection.
// Fallback: all registered games (legacy behavior for groups created before this feature).
export function gamesForGroup(group, date = null) {
  const ids = parseSelected(group);
  const pool = (!ids || ids.length === 0) ? listGames() : ids.map((id) => getGame(id)).filter(Boolean);
  if (!group || group.dailyMode !== "random" || !date || !group.dailyPoolSize) return pool;

  const n = Math.min(pool.length, Math.max(1, group.dailyPoolSize));
  if (n >= pool.length) return pool;

  const rng = mulberry32(`group-${group.id}::${date}`);
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Validate a selection against current rules; returns the cleaned array or throws.
export function validateSelection(ids) {
  if (!Array.isArray(ids)) throw new Error("selectedGames must be an array of game ids");
  const cleaned = Array.from(new Set(ids.filter((id) => !!getGame(id))));
  if (cleaned.length < MIN_SELECTED)
    throw new Error(`Pick at least ${MIN_SELECTED} game`);
  return cleaned;
}

// Pick a sensible default: first N registered games.
export function defaultSelection() {
  return listGames().slice(0, DEFAULT_SELECTED).map((g) => g.id);
}
