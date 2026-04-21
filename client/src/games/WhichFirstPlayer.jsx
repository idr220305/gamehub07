import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

export default function WhichFirstPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { left, right } = publicPuzzle;
  const [picked, setPicked] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [busy, setBusy] = useState(false);

  async function pick(side) {
    if (busy || picked) return;
    setPicked(side);
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, side);
      setReveal(feedback);
      feedback.correct ? sfx.correct() : sfx.wrong();
      await new Promise((r) => setTimeout(r, 1400));
      await onSubmit(side, {}, Date.now() - startedAt);
    } finally { setBusy(false); }
  }

  function stateFor(side) {
    if (!reveal) return picked === side ? "picked" : "idle";
    if (side === reveal.earlierSide) return "earlier";
    if (side === picked && side !== reveal.earlierSide) return "wrong";
    return "other";
  }

  const cls = {
    idle: "bg-white ring-1 ring-slate-200 hover:-translate-y-0.5 hover:shadow-lift",
    picked: "bg-ink text-white ring-0",
    earlier: "bg-success-100 text-success-900 ring-2 ring-success-400 animate-pop",
    wrong: "bg-danger-100 text-danger-900 ring-2 ring-danger-400 animate-shake",
    other: "bg-slate-50 text-slate-500 ring-1 ring-slate-200 opacity-80",
  };

  function Card({ side, event }) {
    const st = stateFor(side);
    const year = reveal ? (side === "left" ? reveal.leftYear : reveal.rightYear) : null;
    return (
      <button
        onClick={() => pick(side)}
        disabled={busy || picked != null}
        className={`flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-3xl p-6 text-center shadow-soft transition-all duration-200 ${cls[st]}`}
      >
        <div className="text-sm font-semibold leading-snug">{event.text}</div>
        {year != null && (
          <div className="text-3xl font-black tabular-nums animate-scale-in">{year}</div>
        )}
        {year == null && (
          <div className="mt-1 text-xs uppercase tracking-widest text-slate-400">Tap if earlier</div>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-slate-500">
        Which happened <b className="text-slate-900">first</b>?
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card side="left" event={left} />
        <Card side="right" event={right} />
      </div>
    </div>
  );
}
