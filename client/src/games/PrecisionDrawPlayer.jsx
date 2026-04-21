import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

const SIZE = 320;

export default function PrecisionDrawPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { name, target, closed } = publicPuzzle;
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [similarity, setSimilarity] = useState(null);
  const [busy, setBusy] = useState(false);
  const [previewed, setPreviewed] = useState(false);

  // Scale target points (400x400) down to our 320px canvas.
  const scaled = target.map((p) => ({ x: (p.x / 400) * SIZE, y: (p.y / 400) * SIZE }));

  useEffect(() => {
    draw();
  }, [points, similarity]);

  function draw() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Target (light gray guide).
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    scaled.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    if (closed) ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // User line.
    if (points.length > 0) {
      ctx.strokeStyle =
        similarity == null
          ? "#0f172a"
          : similarity > 0.7
          ? "#10b981"
          : similarity > 0.4
          ? "#f59e0b"
          : "#ef4444";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  }

  function getPoint(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * SIZE,
      y: ((clientY - rect.top) / rect.height) * SIZE,
    };
  }

  function start(e) {
    if (busy) return;
    e.preventDefault();
    setSimilarity(null);
    setPreviewed(false);
    setDrawing(true);
    setPoints([getPoint(e)]);
  }
  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    setPoints((p) => [...p, getPoint(e)]);
  }
  function end() {
    setDrawing(false);
  }

  async function preview() {
    if (points.length < 2 || busy) return;
    setBusy(true);
    try {
      // Scale points back up to 400x400 for the server.
      const scaledOut = points.map((p) => ({ x: (p.x / SIZE) * 400, y: (p.y / SIZE) * 400 }));
      const { feedback } = await api.feedback(gameId, scaledOut);
      setSimilarity(feedback.similarity);
      setPreviewed(true);
      feedback.similarity > 0.5 ? sfx.correct() : sfx.wrong();
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (points.length < 2 || busy) return;
    setBusy(true);
    try {
      const scaledOut = points.map((p) => ({ x: (p.x / SIZE) * 400, y: (p.y / SIZE) * 400 }));
      await onSubmit(scaledOut, {}, Date.now() - startedAt);
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setPoints([]);
    setSimilarity(null);
    setPreviewed(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-slate-500">
        Trace this <b>{name}</b> — closer matches score higher.
      </p>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
          className="touch-none rounded-2xl bg-white ring-1 ring-slate-200"
          style={{ cursor: "crosshair", maxWidth: "100%" }}
        />
      </div>

      {similarity != null && (
        <p
          className={`text-center text-sm font-semibold ${
            similarity > 0.7 ? "text-emerald-600" : similarity > 0.4 ? "text-amber-600" : "text-rose-600"
          }`}
        >
          Similarity: {Math.round(similarity * 100)}%
        </p>
      )}

      <div className="flex justify-center gap-2">
        <button className="btn-ghost" onClick={clear} disabled={busy || points.length === 0}>
          Clear
        </button>
        <button className="btn-secondary" onClick={preview} disabled={busy || points.length < 2}>
          Preview score
        </button>
        <button className="btn-primary" onClick={commit} disabled={busy || points.length < 2}>
          {previewed ? "Commit this attempt" : "Submit"}
        </button>
      </div>
    </div>
  );
}
