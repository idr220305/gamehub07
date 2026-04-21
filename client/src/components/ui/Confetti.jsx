// Lightweight confetti burst — emits when `trigger` changes.
// No animation libraries; pure CSS keyframes.

import { useEffect, useState } from "react";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

export default function Confetti({ trigger, count = 28 }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (trigger == null) return;
    const next = Array.from({ length: count }, (_, i) => ({
      id: trigger + "-" + i,
      x: 50 + (Math.random() - 0.5) * 60,
      delay: Math.random() * 150,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
      rotate: Math.random() * 360,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 1300);
    return () => clearTimeout(t);
  }, [trigger, count]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block animate-confetti"
          style={{
            left: `${p.x}%`,
            background: p.color,
            width: p.size,
            height: p.size,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}ms`,
            borderRadius: "2px",
          }}
        />
      ))}
    </div>
  );
}
