import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

export default function OddOneOutPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { items } = publicPuzzle;
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [busy, setBusy] = useState(false);

  async function pick(i) {
    if (busy || picked != null) return;
    setPicked(i);
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, i);
      setRevealed({ oddIndex: feedback.oddIndex, correct: feedback.correct });
      feedback.correct ? sfx.correct() : sfx.wrong();
      await new Promise((r) => setTimeout(r, 1100));
      await onSubmit(i, {}, Date.now() - startedAt);
    } finally { setBusy(false); }
  }

  function stateFor(i) {
    if (!revealed) return picked === i ? "picked" : "idle";
    if (i === revealed.oddIndex) return "odd";
    if (i === picked && !revealed.correct) return "wrong";
    return "same";
  }

  const cls = {
    idle: "bg-white ring-1 ring-slate-200 hover:bg-slate-50 hover:-translate-y-0.5",
    picked: "bg-ink text-white ring-0",
    odd: "bg-success-100 text-success-900 ring-2 ring-success-400 animate-pop",
    wrong: "bg-danger-100 text-danger-900 ring-2 ring-danger-400 animate-shake",
    same: "bg-slate-50 text-slate-400 ring-1 ring-slate-200 opacity-70",
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-slate-500">Which one doesn't belong?</p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((t, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={busy || picked != null}
            className={`flex items-center justify-center rounded-2xl p-6 text-lg font-bold transition-all duration-200 shadow-soft ${cls[stateFor(i)]}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
