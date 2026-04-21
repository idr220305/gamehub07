import { useEffect, useMemo, useRef, useState } from "react";

// Text input with suggestions below. Props:
// - value, onChange
// - options: string[]  (candidate suggestions)
// - onSubmit(value): called when Enter pressed
// - placeholder, disabled, maxSuggestions
export default function Autocomplete({
  value, onChange, onSubmit, options = [],
  placeholder, disabled, maxSuggestions = 6, autoFocus,
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    // Score: prefix > substring
    const scored = options
      .map((o) => {
        const s = o.toLowerCase();
        if (s === q) return { o, rank: 0 };
        if (s.startsWith(q)) return { o, rank: 1 };
        if (s.includes(q)) return { o, rank: 2 };
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank || a.o.length - b.o.length)
      .slice(0, maxSuggestions)
      .map((x) => x.o);
    return scored;
  }, [value, options, maxSuggestions]);

  useEffect(() => { setHighlight(0); }, [value]);

  function choose(s) {
    onChange(s);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (open && filtered.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % filtered.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + filtered.length) % filtered.length); return; }
      if (e.key === "Tab" || (e.key === "Enter" && filtered[highlight])) {
        e.preventDefault();
        const pick = filtered[highlight];
        onChange(pick);
        setOpen(false);
        return;
      }
      if (e.key === "Escape") { setOpen(false); return; }
    }
    if (e.key === "Enter") {
      setOpen(false);
      onSubmit?.(value);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="input-lg"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck="false"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl bg-white p-1 shadow-lift ring-1 ring-slate-200">
          {filtered.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                onMouseEnter={() => setHighlight(i)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition
                  ${i === highlight ? "bg-primary-50 text-primary-900" : "hover:bg-slate-50"}`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
