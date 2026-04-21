import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";

export default function CategoryBlitzPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { category, letter } = publicPuzzle;
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ key: 0, kind: null });

  async function guess() {
    const input = value.trim();
    if (!input || busy) return;
    // Local pre-check: must start with the given letter.
    if (input[0].toLowerCase() !== letter.toLowerCase()) {
      setFlash({ key: flash.key + 1, kind: "wrong" });
      sfx.wrong();
      return;
    }
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, input);
      if (feedback.correct) {
        setFlash({ key: flash.key + 1, kind: "correct" });
        sfx.correct();
        await onSubmit(input, {}, Date.now() - startedAt);
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
    try { await onSubmit(value.trim() || "?", {}, Date.now() - startedAt); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <FeedbackFlash trigger={flash.key} kind={flash.kind}>
        <div className="rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 p-8 ring-1 ring-slate-200">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-slate-400">Category</div>
            <div className="mt-1 text-2xl font-extrabold text-ink">{category}</div>
            <div className="mt-4 text-xs uppercase tracking-widest text-slate-400">Must start with</div>
            <div className="mx-auto mt-2 grid h-20 w-20 place-items-center rounded-2xl bg-ink text-5xl font-black text-white shadow-lift">
              {letter}
            </div>
          </div>
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
          placeholder={`A ${category.toLowerCase()} starting with ${letter}…`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && guess()}
          autoFocus
          disabled={busy}
        />
        <div className="flex gap-2">
          <button className="btn-accent flex-1 py-3" onClick={guess} disabled={!value.trim() || busy}>Submit</button>
          <button className="btn-secondary py-3" onClick={giveUp} disabled={busy}>Skip</button>
        </div>
        <p className="text-center text-xs text-slate-500">Faster = more points.</p>
      </div>
    </div>
  );
}
