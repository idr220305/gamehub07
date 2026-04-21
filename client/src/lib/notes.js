// Play a sequence of notes like [["C4", 0.4], ["E4", 0.2], ...] via WebAudio.

const NOTE_FREQ = (() => {
  const base = { C: -9, "C#": -8, D: -7, "D#": -6, E: -5, F: -4, "F#": -3, G: -2, "G#": -1, A: 0, "A#": 1, B: 2 };
  const map = {};
  for (const [name, semitonesFromA] of Object.entries(base)) {
    for (let oct = 2; oct <= 6; oct++) {
      // A4 = 440 Hz. Semitone distance from A4 = (oct - 4) * 12 + semitonesFromA.
      const semi = (oct - 4) * 12 + semitonesFromA;
      map[`${name}${oct}`] = 440 * Math.pow(2, semi / 12);
    }
  }
  return map;
})();

let ctx;
function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

export async function playNotes(notes) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") await c.resume();
  let t = c.currentTime + 0.05;
  for (const [name, dur] of notes) {
    const freq = NOTE_FREQ[name] || 440;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(c.destination);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur * 0.95; // slight overlap for legato feel
  }
  // Wait for the whole sequence to finish.
  const total = notes.reduce((s, [, d]) => s + d * 0.95, 0) + 0.1;
  await new Promise((r) => setTimeout(r, total * 1000));
}
