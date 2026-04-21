import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { getGameIcon } from "../games/index.js";
import Badge from "./ui/Badge.jsx";

const MIN = 1;
const DIFF_VARIANT = { easy: "success", medium: "warn", hard: "danger" };

export { MIN as MIN_GAMES };

export default function GameSelector({ value, onChange }) {
  const [games, setGames] = useState(null);

  useEffect(() => {
    api.listGames().then(setGames).catch(() => setGames([]));
  }, []);

  if (!games) return <div className="skel h-64" />;

  const selected = new Set(value);
  const count = selected.size;

  function toggle(id) {
    if (selected.has(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  function selectAll() { onChange(games.map((g) => g.id)); }
  function selectNone() { onChange([]); }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {count} selected <span className="font-normal text-slate-500">/ {games.length} games</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={selectAll} className="text-xs font-semibold text-primary-600 hover:underline">All</button>
          <button type="button" onClick={selectNone} className="text-xs font-semibold text-slate-500 hover:underline">None</button>
        </div>
      </div>
      {count < MIN && <p className="text-xs text-danger-600">Pick at least {MIN} game.</p>}

      <div className="grid gap-2 sm:grid-cols-2">
        {games.map((g) => {
          const on = selected.has(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(g.id)}
              className={`group relative flex items-start gap-3 rounded-2xl p-3 text-left ring-1 transition-all duration-200
                ${on
                  ? "bg-primary-50 ring-primary-500 shadow-soft hover:-translate-y-0.5"
                  : "bg-white ring-slate-200 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-soft"}`}
            >
              <div className={`grid h-11 w-11 flex-none place-items-center rounded-xl text-xl transition-transform duration-200 group-hover:scale-110
                ${on ? "bg-primary-600 text-white" : "bg-slate-100 text-ink ring-1 ring-slate-200"}`}>
                {getGameIcon(g.id)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-bold text-ink">{g.name}</span>
                  <Badge variant={DIFF_VARIANT[g.difficulty] || "neutral"} size="sm">{g.difficulty}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{g.description}</p>
              </div>
              <div
                className={`grid h-6 w-6 flex-none place-items-center rounded-full text-xs font-bold transition-all
                  ${on ? "bg-primary-600 text-white scale-100" : "bg-slate-100 text-slate-400 scale-90"}`}
              >
                {on ? "✓" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
