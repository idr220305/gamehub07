import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

export default function MemoryGridPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { pattern, gridSize, previewMs } = publicPuzzle;
  const [phase, setPhase] = useState("preview"); // preview | recall | reveal
  const [picks, setPicks] = useState([]);
  const [reveal, setReveal] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPhase("recall"), previewMs);
    return () => clearTimeout(t);
  }, [previewMs]);

  function toggle(i) {
    if (phase !== "recall" || busy) return;
    setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  }

  async function submit() {
    if (busy || phase !== "recall") return;
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, picks);
      setReveal(feedback);
      setPhase("reveal");
      feedback.correct ? sfx.correct() : sfx.wrong();
      await new Promise((r) => setTimeout(r, 1400));
      await onSubmit(picks, {}, Date.now() - startedAt);
    } finally { setBusy(false); }
  }

  const cells = Array.from({ length: gridSize * gridSize });
  function cellClass(i) {
    if (phase === "preview") return pattern.includes(i) ? "bg-primary-600 ring-primary-700 animate-pop" : "bg-white ring-slate-200";
    if (phase === "recall") return picks.includes(i) ? "bg-ink ring-ink text-white" : "bg-white ring-slate-200 hover:bg-slate-50";
    // reveal
    const isPattern = pattern.includes(i);
    const isPicked = picks.includes(i);
    if (isPattern && isPicked) return "bg-success-500 ring-success-700 text-white animate-pop";
    if (isPattern && !isPicked) return "bg-warn-200 ring-warn-500"; // missed
    if (!isPattern && isPicked) return "bg-danger-300 ring-danger-500 animate-shake"; // wrong
    return "bg-white ring-slate-200";
  }

  return (
    <div className="space-y-5">
      <p className="text-center text-sm text-slate-500">
        {phase === "preview" && "Memorize the pattern…"}
        {phase === "recall" && `Tap the ${pattern.length} cells you remember.`}
        {phase === "reveal" && (reveal?.correct ? "Nailed it!" : "Here's the original pattern.")}
      </p>

      <div
        className="mx-auto grid gap-2"
        style={{ width: "min(100%, 320px)", gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {cells.map((_, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            disabled={phase !== "recall" || busy}
            className={`aspect-square rounded-xl ring-2 shadow-soft transition-all duration-200 ${cellClass(i)}`}
          />
        ))}
      </div>

      {phase === "recall" && (
        <div className="flex justify-center">
          <button className="btn-accent px-6 py-3" onClick={submit} disabled={busy || picks.length === 0}>
            Submit ({picks.length})
          </button>
        </div>
      )}
    </div>
  );
}
