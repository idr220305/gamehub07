// Sound effects via WebAudio — no asset files needed.
// Respects a persisted on/off toggle.

const TOGGLE_KEY = "dgh.sound";

export function soundEnabled() {
  return localStorage.getItem(TOGGLE_KEY) !== "off";
}

export function setSoundEnabled(on) {
  localStorage.setItem(TOGGLE_KEY, on ? "on" : "off");
}

let ctx;
function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

function tone(freq, duration = 0.12, type = "sine", gain = 0.08) {
  if (!soundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(c.destination);
  const now = c.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

export const sfx = {
  correct() {
    tone(660, 0.1, "triangle");
    setTimeout(() => tone(880, 0.14, "triangle"), 90);
  },
  wrong() {
    tone(220, 0.18, "sawtooth", 0.05);
  },
  tick() {
    tone(500, 0.05, "square", 0.04);
  },
  complete() {
    tone(523, 0.12, "triangle");
    setTimeout(() => tone(659, 0.12, "triangle"), 100);
    setTimeout(() => tone(784, 0.2, "triangle"), 200);
  },
};
