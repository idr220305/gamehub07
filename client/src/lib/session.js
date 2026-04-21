// Single source of truth for the current user.
// Backed by localStorage (so it survives refresh) and a pub/sub for live updates
// across all components in the app.

const KEY = "dgh.user";
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let cache = read();

export function getSession() {
  return cache;
}

export function setSession(user) {
  cache = user || null;
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
  } catch {}
  for (const fn of listeners) fn(cache);
}

export function clearSession() {
  setSession(null);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// React hook — re-renders when session changes anywhere in the app.
import { useEffect, useState } from "react";

export function useSession() {
  const [s, setS] = useState(cache);
  useEffect(() => subscribe(setS), []);
  return s;
}
