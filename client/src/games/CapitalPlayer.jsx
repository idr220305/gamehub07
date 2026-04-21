import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";

export default function CapitalPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { country, flag } = publicPuzzle;
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ key: 0, kind: null });

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
        setWrong((w) => [...w, input]);
        setValue("");
      }
    } finally { setBusy(false); }
  }

  async function giveUp() {
    if (busy) return;
    setBusy(true);
    try { await onSubmit(value.trim() || "?", { guesses: wrong.length + 1 }, Date.now() - startedAt); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <FeedbackFlash trigger={flash.key} kind={flash.kind}>
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-br from-sky-50 to-cyan-50 p-10 ring-1 ring-slate-200 select-none">
          <div className="text-8xl leading-none">{flag}</div>
          <div className="mt-1 text-2xl font-black tracking-tight text-ink">{country}</div>
          <div className="text-xs uppercase tracking-widest text-slate-400">What's the capital?</div>
        </div>
      </FeedbackFlash>

      {wrong.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {wrong.map((w, i) => <span key={i} className="chip bg-danger-50 text-danger-600">✗ {w}</span>)}
        </div>
      )}

      <div className="space-y-2">
        <input
          className="input-lg"
          placeholder="Capital city…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && guess()}
          autoFocus
          disabled={busy}
        />
        <div className="flex gap-2">
          <button className="btn-accent flex-1 py-3" onClick={guess} disabled={!value.trim() || busy}>Guess</button>
          <button className="btn-secondary py-3" onClick={giveUp} disabled={busy}>Give up</button>
        </div>
      </div>
    </div>
  );
}
