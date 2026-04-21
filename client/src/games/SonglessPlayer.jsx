import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";
import Autocomplete from "../components/Autocomplete.jsx";

export default function SonglessPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { hints } = publicPuzzle;
  const [hintsShown, setHintsShown] = useState(1);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ key: 0, kind: null });

  async function onGuess() {
    const input = value.trim();
    if (!input || busy) return;
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, input);
      if (feedback.correct) {
        setFlash({ key: flash.key + 1, kind: "correct" });
        sfx.correct();
        await onSubmit(input, { hintsUsed: hintsShown, guesses: wrong.length + 1 }, Date.now() - startedAt);
      } else {
        setFlash({ key: flash.key + 1, kind: "wrong" });
        sfx.wrong();
        setWrong((w) => [...w, input]);
        setValue("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function giveUp() {
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit(value.trim() || "?", { hintsUsed: hintsShown, guesses: wrong.length + 1 }, Date.now() - startedAt);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FeedbackFlash trigger={flash.key} kind={flash.kind}>
        <div className="space-y-3 rounded-3xl bg-gradient-to-br from-fuchsia-50 to-indigo-50 p-6 ring-1 ring-slate-200">
          <div className="text-center text-4xl">🎵</div>
          {hints.slice(0, hintsShown).map((h, i) => (
            <p key={i} className="text-center text-base italic text-slate-700">"{h}"</p>
          ))}
        </div>
      </FeedbackFlash>

      {hintsShown < hints.length && (
        <div className="text-center">
          <button
            className="btn-secondary"
            onClick={() => { setHintsShown(hintsShown + 1); sfx.tick(); }}
            disabled={busy}
          >
            Reveal another hint (–points)
          </button>
        </div>
      )}

      {wrong.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {wrong.map((w, i) => (
            <span key={i} className="chip bg-rose-50 text-rose-600">✗ {w}</span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Autocomplete
          value={value}
          onChange={setValue}
          onSubmit={onGuess}
          options={publicPuzzle.suggestions || []}
          placeholder="Song title…"
          disabled={busy}
          autoFocus
        />
        <div className="flex gap-2">
          <button className="btn-primary flex-1 py-3" onClick={onGuess} disabled={!value.trim() || busy}>
            Guess
          </button>
          <button className="btn-secondary py-3" onClick={giveUp} disabled={busy}>
            Give up
          </button>
        </div>
      </div>
    </div>
  );
}
