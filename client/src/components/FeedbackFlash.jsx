import { useEffect, useState } from "react";

// Wrap any element to flash a green (correct) or red (wrong) ring briefly.
// Usage: <FeedbackFlash trigger={flashKey} kind="correct" /> — bump `trigger` to re-fire.
export default function FeedbackFlash({ trigger, kind, children, className = "" }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (trigger == null) return;
    setActive(true);
    const t = setTimeout(() => setActive(false), 650);
    return () => clearTimeout(t);
  }, [trigger]);

  const ring =
    active && kind === "correct"
      ? "ring-4 ring-emerald-400 shadow-[0_0_40px_-8px_rgba(16,185,129,0.6)]"
      : active && kind === "wrong"
      ? "ring-4 ring-rose-400 shadow-[0_0_40px_-8px_rgba(244,63,94,0.5)] animate-shake"
      : "ring-0";
  return (
    <div className={`relative rounded-3xl transition-all duration-300 ${ring} ${className}`}>
      {children}
    </div>
  );
}
