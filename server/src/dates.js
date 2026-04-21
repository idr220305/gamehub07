// Date helpers — everything in UTC so all groups everywhere share the same "day".

export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function parseDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

// Returns YYYY-MM-DD for the Monday of the ISO week containing `date`.
export function startOfWeekUTC(date) {
  const d = typeof date === "string" ? parseDate(date) : new Date(date);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7;  // Monday=0
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return formatDate(monday);
}

// YYYY-MM-DD one day earlier.
export function prevDate(ymd) {
  const d = parseDate(ymd);
  d.setUTCDate(d.getUTCDate() - 1);
  return formatDate(d);
}

// Given a set of YYYY-MM-DD strings the user submitted on, compute the current streak
// ending at `today` (or the most recent submission date ≤ today).
export function computeStreak(submittedDates, today = todayUTC()) {
  const set = new Set(submittedDates);
  let streak = 0;
  let cursor = today;
  // If today not yet played, streak continues from yesterday if yesterday was played.
  if (!set.has(cursor)) cursor = prevDate(cursor);
  while (set.has(cursor)) {
    streak++;
    cursor = prevDate(cursor);
  }
  return streak;
}
