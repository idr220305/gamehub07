import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";

export default function NumberSequencePlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { seq } = publicPuzzle;
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ key: 0, kind: null });
  const MAX_TRIES = 3;

  async function guess() {
    const input = value.trim();
    if (!input || busy) return;
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, input);
      if (feedback.correct) {
        setFlash({ key: flash.key + 1, kind: "correct" });
        sfx.correct();
        await onSubmit(Number(input), { guesses: wrong.length + 1 }, Date.now() - startedAt);
      } else {
        setFlash({ key: flash.key + 1, kind: "wrong" });
        sfx.wrong();
        if (wrong.length + 1 >= MAX_TRIES) {
          await onSubmit(Number(input), { guesses: wrong.length + 1 }, Date.now() - startedAt);
        } else {
          setWrong((w) => [...w, input]);
          setValue("");
        }
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <FeedbackFlash trigger={flash.key} kind={flash.kind}>
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-8 ring-1 ring-slate-200 select-none">
          {seq.map((n, i) => (
            <span
              key={i}
              className="grid h-16 min-w-16 place-items-center rounded-xl bg-white px-3 text-2xl font-black text-ink shadow-soft ring-1 ring-slate-200 animate-scale-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {n}
            </span>
          ))}
          <span className="grid h-16 min-w-16 place-items-center rounded-xl bg-amber-100 px-3 text-2xl font-black text-amber-700 ring-2 ring-dashed ring-amber-300">
            ?
          </span>
        </div>
      </FeedbackFlash>

      {wrong.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {wrong.map((w, i) => <span key={i} className="chip bg-danger-50 text-danger-600">✗ {w}</span>)}
        </div>
      )}

      <div className="space-y-2">
        <input
          className="input-lg tabular-nums"
          type="number"
          placeholder="Next number…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && guess()}
          autoFocus
          disabled={busy}
        />
        <button className="btn-accent w-full py-3 text-base" onClick={guess} disabled={!value.trim() || busy}>
          {wrong.length + 1 >= MAX_TRIES ? "Final guess" : "Guess"}
        </button>
      </div>
    </div>
  );
}
