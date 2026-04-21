import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";

export default function AnagramPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { scrambled, maxGuesses } = publicPuzzle;
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ key: 0, kind: null });
  const remaining = maxGuesses - wrong.length;

  async function guess() {
    const input = value.trim();
    if (!input || busy) return;
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, input);
      if (feedback.correct) {
        setFlash({ key: flash.key + 1, kind: "correct" });
        sfx.correct();
        await onSubmit(input, { guesses: wrong.length + 1 }, Date.now() - startedAt);
      } else {
        setFlash({ key: flash.key + 1, kind: "wrong" });
        sfx.wrong();
        if (remaining <= 1) {
          await onSubmit(input, { guesses: wrong.length + 1 }, Date.now() - startedAt);
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
        <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 p-10 ring-1 ring-slate-200 select-none">
          <div className="flex flex-wrap justify-center gap-2">
            {scrambled.toUpperCase().split("").map((c, i) => (
              <span
                key={i}
                className="grid h-14 w-12 place-items-center rounded-xl bg-white text-2xl font-black text-ink shadow-soft ring-1 ring-slate-200 animate-scale-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </FeedbackFlash>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Guesses: <b className="text-slate-900">{wrong.length}</b> / {maxGuesses}</span>
        <span>Remaining: <b className="text-slate-900">{remaining}</b></span>
      </div>

      {wrong.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {wrong.map((w, i) => <span key={i} className="chip bg-danger-50 text-danger-600">✗ {w}</span>)}
        </div>
      )}

      <div className="space-y-2">
        <input
          className="input-lg"
          placeholder="Unscrambled word…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && guess()}
          autoFocus
          disabled={busy}
        />
        <button className="btn-accent w-full py-3 text-base" onClick={guess} disabled={!value.trim() || busy}>
          {remaining <= 1 ? "Final guess" : "Guess"}
        </button>
      </div>
    </div>
  );
}
