import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

export default function TrueFalsePlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { text } = publicPuzzle;
  const [picked, setPicked] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [busy, setBusy] = useState(false);

  async function pick(val) {
    if (busy || picked != null) return;
    setPicked(val);
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, val);
      setReveal({ truth: feedback.truth, correct: feedback.correct });
      feedback.correct ? sfx.correct() : sfx.wrong();
      await new Promise((r) => setTimeout(r, 1000));
      await onSubmit(val, {}, Date.now() - startedAt);
    } finally { setBusy(false); }
  }

  function stateFor(val) {
    if (!reveal) return picked === val ? "picked" : "idle";
    if (val === reveal.truth) return "truth";
    if (val === picked && val !== reveal.truth) return "wrong";
    return "other";
  }

  const baseBtn = "rounded-3xl py-10 text-3xl font-black shadow-soft transition-all duration-200 ring-1";
  const cls = {
    idle: "bg-white text-ink ring-slate-200 hover:-translate-y-0.5 hover:shadow-lift",
    picked: "bg-ink text-white ring-ink",
    truth: "bg-success-500 text-white ring-success-700 animate-pop",
    wrong: "bg-danger-500 text-white ring-danger-700 animate-shake",
    other: "bg-slate-50 text-slate-400 ring-slate-200 opacity-70",
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-lime-50 p-8 ring-1 ring-slate-200">
        <p className="text-center text-xl font-semibold leading-relaxed text-ink">"{text}"</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className={`${baseBtn} ${cls[stateFor(true)]}`} onClick={() => pick(true)} disabled={busy || picked != null}>
          ✓ True
        </button>
        <button className={`${baseBtn} ${cls[stateFor(false)]}`} onClick={() => pick(false)} disabled={busy || picked != null}>
          ✗ False
        </button>
      </div>
      <p className="text-center text-xs text-slate-500">Answer fast for more points.</p>
    </div>
  );
}
