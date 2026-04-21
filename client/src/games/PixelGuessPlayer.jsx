import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";

// We render the emoji into a tiny canvas (very few pixels), then scale the canvas
// up with image-rendering: pixelated to produce a chunky low-res look.
// Each "stage" doubles the resolution.

export default function PixelGuessPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { emoji, stages } = publicPuzzle;
  const [stage, setStage] = useState(0);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState([]);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ key: 0, kind: null });
  const canvasRef = useRef(null);

  // Render emoji pixelated at current stage resolution.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const sizes = [6, 12, 24, 64]; // per stage
    const res = sizes[Math.min(stage, sizes.length - 1)];
    c.width = res;
    c.height = res;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, res, res);
    ctx.font = `${Math.floor(res * 0.9)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, res / 2, res / 2);
  }, [emoji, stage]);

  // Auto-reveal more over time.
  useEffect(() => {
    if (stage >= stages - 1) return;
    const t = setTimeout(() => setStage((s) => Math.min(s + 1, stages - 1)), 5000);
    return () => clearTimeout(t);
  }, [stage, stages]);

  async function guess() {
    const input = value.trim();
    if (!input || busy) return;
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, input);
      if (feedback.correct) {
        setFlash({ key: flash.key + 1, kind: "correct" });
        sfx.correct();
        await onSubmit(input, { stage }, Date.now() - startedAt);
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
    try { await onSubmit(value.trim() || "?", { stage }, Date.now() - startedAt); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <FeedbackFlash trigger={flash.key} kind={flash.kind}>
        <div className="mx-auto flex aspect-square w-full max-w-xs items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 ring-1 ring-slate-200">
          <canvas
            ref={canvasRef}
            className="h-full w-full"
            style={{ imageRendering: "pixelated", transition: "filter 400ms ease" }}
          />
        </div>
      </FeedbackFlash>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Resolution: {["6×6", "12×12", "24×24", "64×64"][stage]}</span>
        <button className="btn-ghost py-1 text-xs" onClick={() => setStage((s) => Math.min(s + 1, stages - 1))} disabled={stage >= stages - 1}>
          Sharpen →
        </button>
      </div>

      {wrong.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {wrong.map((w, i) => <span key={i} className="chip bg-danger-50 text-danger-600">✗ {w}</span>)}
        </div>
      )}

      <div className="space-y-2">
        <input
          className="input-lg"
          placeholder="What is it?"
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
