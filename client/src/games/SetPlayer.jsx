import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

const SHAPE_SVG = {
  circle: (c) => `<circle cx="20" cy="20" r="14" fill="${c}"/>`,
  square: (c) => `<rect x="6" y="6" width="28" height="28" rx="4" fill="${c}"/>`,
  triangle: (c) => `<polygon points="20,4 36,34 4,34" fill="${c}"/>`,
};
const COLOR_HEX = { red: "#ef4444", green: "#10b981", blue: "#3b82f6" };

export default function SetPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { cards } = publicPuzzle;
  const [selected, setSelected] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null); // "correct" | "wrong"
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startedAt), 200);
    return () => clearInterval(t);
  }, [startedAt]);

  function toggle(id) {
    if (busy) return;
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id));
    else if (selected.length < 3) setSelected([...selected, id]);
  }

  async function submit() {
    if (selected.length !== 3 || busy) return;
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, selected);
      const nAttempts = attempts + 1;
      setAttempts(nAttempts);
      if (feedback.correct) {
        setFlash("correct");
        sfx.correct();
        await new Promise((r) => setTimeout(r, 700));
        await onSubmit(selected, { attempts: nAttempts }, Date.now() - startedAt);
      } else {
        setFlash("wrong");
        sfx.wrong();
        setTimeout(() => setFlash(null), 700);
        setSelected([]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function giveUp() {
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit([], { attempts: attempts + 1 }, Date.now() - startedAt);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-slate-500">
        Pick 3 cards where each attribute (color / shape / count) is all same or all different.
      </p>

      <div
        className={`grid grid-cols-3 gap-2 rounded-2xl p-1 transition-all ${
          flash === "correct" ? "ring-4 ring-emerald-400" : flash === "wrong" ? "ring-4 ring-rose-400 animate-shake" : ""
        }`}
      >
        {cards.map((c) => {
          const isSel = selected.includes(c.id);
          const shapes = Array.from({ length: c.count }).map(() => SHAPE_SVG[c.shape](COLOR_HEX[c.color])).join("");
          const svg = `<svg viewBox="0 0 ${c.count * 40} 40" xmlns="http://www.w3.org/2000/svg">${
            Array.from({ length: c.count })
              .map((_, i) => `<g transform="translate(${i * 40},0)">${SHAPE_SVG[c.shape](COLOR_HEX[c.color])}</g>`)
              .join("")
          }</svg>`;
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              disabled={busy}
              className={`aspect-[3/2] rounded-xl p-2 transition-all active:scale-95 ${
                isSel ? "bg-slate-900 ring-2 ring-slate-900" : "bg-white ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} alt="" className="h-full w-full" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Attempts: {attempts}
          <span className={`ml-3 font-mono tabular-nums ${elapsed > 45000 ? "text-danger-600 font-bold" : elapsed > 30000 ? "text-warn-600" : "text-slate-500"}`}>
            ⏱ {(elapsed / 1000).toFixed(0)}s
          </span>
          {elapsed > 45000 && <span className="ml-1 text-danger-600">(score dropping)</span>}
        </span>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setSelected([])} disabled={busy || selected.length === 0}>
            Clear
          </button>
          <button className="btn-secondary" onClick={giveUp} disabled={busy}>
            Give up
          </button>
          <button className="btn-primary" onClick={submit} disabled={busy || selected.length !== 3}>
            Check set
          </button>
        </div>
      </div>
    </div>
  );
}
