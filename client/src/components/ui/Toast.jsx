// Simple global toast system. No portal — just a top-level container in App.
import { useEffect, useState } from "react";

const listeners = new Set();
let nextId = 1;

export function toast(message, opts = {}) {
  const t = { id: nextId++, message, kind: opts.kind || "info", duration: opts.duration ?? 2400 };
  for (const fn of listeners) fn(t);
}

export function ToastViewport() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = (t) => {
      setItems((arr) => [...arr, t]);
      if (t.duration > 0) {
        setTimeout(() => setItems((arr) => arr.filter((x) => x.id !== t.id)), t.duration);
      }
    };
    listeners.add(onToast);
    return () => listeners.delete(onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2 space-y-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto animate-fade-in rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-lift ring-1 ${
            t.kind === "success"
              ? "bg-success-500 text-white ring-success-600"
              : t.kind === "error"
              ? "bg-danger-500 text-white ring-danger-600"
              : "bg-ink text-white ring-ink"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
