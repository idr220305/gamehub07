import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

export default function FakeFactPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { topic, facts } = publicPuzzle;
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Tick timer every 100ms while the user hasn't picked.
  useEffect(() => {
    if (picked != null) return;
    const t = setInterval(() => setElapsed(Date.now() - startedAt), 100);
    return () => clearInterval(t);
  }, [picked, startedAt]);

  async function pick(i) {
    if (busy || picked != null) return;
    setPicked(i);
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, i);
      setRevealed({ fakeIndex: feedback.fakeIndex, pickedCorrect: feedback.correct });
      feedback.correct ? sfx.correct() : sfx.wrong();
      await new Promise((r) => setTimeout(r, 1100));
      await onSubmit(i, {}, Date.now() - startedAt);
    } finally { setBusy(false); }
  }

  function stateFor(i) {
    if (!revealed) return picked === i ? "picked" : "idle";
    if (i === revealed.fakeIndex) return "fake";
    if (i === picked && !revealed.pickedCorrect) return "wrong";
    return "real";
  }

  const stateCls = {
    idle: "bg-white ring-1 ring-slate-200 hover:bg-slate-50 hover:-translate-y-0.5",
    picked: "bg-ink text-white ring-0",
    fake: "bg-success-100 text-success-900 ring-2 ring-success-400 animate-pop",
    wrong: "bg-danger-100 text-danger-900 ring-2 ring-danger-400 animate-shake",
    real: "bg-slate-50 text-slate-600 ring-1 ring-slate-200 opacity-80",
  };

  const secs = (elapsed / 1000).toFixed(1);
  const timerColor = elapsed < 8000 ? "text-success-600" : elapsed < 20000 ? "text-warn-600" : "text-danger-600";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm uppercase tracking-wide text-slate-500">Topic: {topic}</span>
        <span className={`font-mono text-sm font-bold ${timerColor} tabular-nums`}>
          ⏱ {secs}s
        </span>
      </div>
      <p className="text-center text-sm text-slate-500">
        Which statement is the fake? <span className="text-slate-400">Quick answers score more.</span>
      </p>
      <div className="space-y-3">
        {facts.map((f, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={busy || picked != null}
            className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-all duration-200 shadow-soft ${stateCls[stateFor(i)]}`}
          >
            <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-white/20 text-sm font-bold">
              {"ABC"[i]}
            </span>
            <span className="text-base leading-snug">{f}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
