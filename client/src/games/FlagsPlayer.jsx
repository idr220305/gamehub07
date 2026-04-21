import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";
import Autocomplete from "../components/Autocomplete.jsx";

export default function FlagsPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { svg, crops } = publicPuzzle;
  const [stage, setStage] = useState(0);
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
        await onSubmit(input, { stage }, Date.now() - startedAt);
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

  function revealMore() {
    if (stage < crops.length - 1) {
      setStage(stage + 1);
      sfx.tick();
    }
  }

  async function giveUp() {
    if (busy) return;
    setBusy(true);
    try {
      await onSubmit(value.trim() || "?", { stage }, Date.now() - startedAt);
    } finally {
      setBusy(false);
    }
  }

  // Flags are SVGs with a 300x200 viewBox. To "crop" to a region (x, y, size),
  // we scale the entire flag so the crop region fills our 280px window, then
  // offset it so (x, y) lands at (0, 0). overflow-hidden clips the rest.
  const crop = crops[stage];
  const flagAspect = 300 / 200; // 1.5
  const WINDOW = 280;
  const scale = WINDOW / crop.size;
  const flagW = 300 * scale;
  const flagH = 200 * scale;
  const offsetX = -crop.x * scale;
  const offsetY = -crop.y * scale;

  const flagUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return (
    <div className="space-y-5">
      <FeedbackFlash trigger={flash.key} kind={flash.kind}>
        <div
          className="mx-auto overflow-hidden rounded-3xl bg-slate-100 ring-1 ring-slate-200"
          style={{ width: WINDOW, height: WINDOW }}
        >
          <div style={{ transform: `translate(${offsetX}px, ${offsetY}px)`, transition: "transform 600ms ease" }}>
            <img
              src={flagUrl}
              alt=""
              style={{ width: flagW, height: flagH, transition: "width 600ms ease, height 600ms ease" }}
            />
          </div>
        </div>
      </FeedbackFlash>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Reveal: {stage + 1} / {crops.length}</span>
        <button className="btn-ghost py-1 text-xs" onClick={revealMore} disabled={stage >= crops.length - 1}>
          Zoom out →
        </button>
      </div>

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
          placeholder="Country name…"
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
