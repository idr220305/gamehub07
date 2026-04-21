import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";

// Instant feedback: each "try" is checked via /feedback. Wrong tries are tracked
// locally; the committing POST only fires when the user is ready (correct, or last try).
export default function EmojiPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState([]);
  const [flash, setFlash] = useState({ key: 0, kind: null });
  const [busy, setBusy] = useState(false);

  const guessesUsed = history.length;
  const remaining = publicPuzzle.maxGuesses - guessesUsed;

  async function onGuess() {
    const input = value.trim();
    if (!input || busy) return;
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, input);
      if (feedback?.correct) {
        setFlash({ key: flash.key + 1, kind: "correct" });
        sfx.correct();
        // Commit immediately on correct.
        await onSubmit(input, { guesses: guessesUsed + 1 }, Date.now() - startedAt);
      } else {
        setFlash({ key: flash.key + 1, kind: "wrong" });
        sfx.wrong();
        if (remaining <= 1) {
          // Out of tries — commit this last (wrong) guess.
          await onSubmit(input, { guesses: guessesUsed + 1 }, Date.now() - startedAt);
        } else {
          setHistory((h) => [...h, input]);
          setValue("");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FeedbackFlash trigger={flash.key} kind={flash.kind}>
        <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-50 to-rose-50 p-10 text-6xl sm:text-7xl ring-1 ring-slate-200 select-none">
          {publicPuzzle.emojis}
        </div>
      </FeedbackFlash>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Guesses: <b className="text-slate-900">{guessesUsed}</b> / {publicPuzzle.maxGuesses}</span>
        <span>Remaining: <b className="text-slate-900">{remaining}</b></span>
      </div>

      {history.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {history.map((h, i) => (
            <span key={i} className="chip bg-rose-50 text-rose-600">✗ {h}</span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <input
          className="input text-center text-lg"
          placeholder="Type your guess…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onGuess()}
          autoFocus
          disabled={busy}
        />
        <button className="btn-primary w-full py-3 text-base" onClick={onGuess} disabled={!value.trim() || busy}>
          {remaining <= 1 ? "Final guess" : "Guess"}
        </button>
        <p className="text-center text-xs text-slate-500">
          Each wrong guess costs you points — fewer guesses is better.
        </p>
      </div>
    </div>
  );
}
