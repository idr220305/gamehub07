import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import { playNotes } from "../lib/notes.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";
import Autocomplete from "../components/Autocomplete.jsx";

export default function SoundPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { notes, maxPlays } = publicPuzzle;
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ key: 0, kind: null });

  async function play() {
    if (playing || plays >= maxPlays) return;
    setPlaying(true);
    setPlays(plays + 1);
    try {
      await playNotes(notes);
    } finally {
      setPlaying(false);
    }
  }

  async function onGuess() {
    const input = value.trim();
    if (!input || busy) return;
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, input);
      if (feedback.correct) {
        setFlash({ key: flash.key + 1, kind: "correct" });
        sfx.correct();
        await onSubmit(input, { plays: Math.max(1, plays) }, Date.now() - startedAt);
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
      await onSubmit(value.trim() || "?", { plays: Math.max(1, plays) }, Date.now() - startedAt);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <FeedbackFlash trigger={flash.key} kind={flash.kind}>
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-cyan-50 to-sky-50 p-8 ring-1 ring-slate-200">
          <button
            onClick={play}
            disabled={playing || plays >= maxPlays}
            className={`grid h-24 w-24 place-items-center rounded-full text-4xl shadow-lg transition-all active:scale-95 ${
              playing ? "bg-sky-400 text-white animate-pulse" : "bg-slate-900 text-white hover:bg-slate-800"
            } disabled:opacity-50`}
          >
            {playing ? "🔊" : "▶️"}
          </button>
          <div className="text-sm text-slate-600">
            Plays used: <b>{plays}</b> / {maxPlays} · more plays = fewer points
          </div>
        </div>
      </FeedbackFlash>

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
        />
        <div className="flex gap-2">
          <button className="btn-primary flex-1 py-3" onClick={onGuess} disabled={!value.trim() || busy || plays === 0}>
            Guess
          </button>
          <button className="btn-secondary py-3" onClick={giveUp} disabled={busy}>
            Give up
          </button>
        </div>
        {plays === 0 && <p className="text-center text-xs text-slate-500">Press play to hear the tune first.</p>}
      </div>
    </div>
  );
}
