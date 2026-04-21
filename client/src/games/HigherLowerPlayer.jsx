import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

// Category labels for display.
const CATEGORY_LABELS = {
  population: "Country populations",
  area: "Country areas",
  movies: "Movie release years",
  landmarks: "Landmark heights",
};

export default function HigherLowerPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { chain, statLabel, rounds, category } = publicPuzzle;
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState([]);
  const [results, setResults] = useState([]); // [{correct, actualStat, expected}]
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [animatedStat, setAnimatedStat] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [streakBump, setStreakBump] = useState(0);

  const current = chain[index];
  const next = chain[index + 1];
  const streak = results.filter((r) => r.correct).length;

  // Left card always shows the previous actual value; for round 0 that's chain[0].stat.
  const currentStat = index === 0 ? current.stat : results[index - 1]?.actualStat ?? current.stat;

  useEffect(() => {
    if (!revealed || !results[index]) return;
    const target = results[index].actualStat;
    const start = performance.now();
    const dur = 700;
    setAnimatedStat(0);
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedStat(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [revealed, index, results]);

  async function choose(choice) {
    if (busy || transitioning || revealed) return;
    setBusy(true);
    const nextChoices = [...choices, choice];
    setChoices(nextChoices);
    try {
      const { feedback } = await api.feedback(gameId, nextChoices);
      const last = feedback.rounds[feedback.rounds.length - 1];
      setResults((r) => [...r, last]);
      setRevealed(true);
      if (last.correct) { sfx.correct(); setStreakBump((b) => b + 1); }
      else sfx.wrong();

      await new Promise((r) => setTimeout(r, 1500));

      if (nextChoices.length === rounds) {
        await onSubmit(nextChoices, {}, Date.now() - startedAt);
        sfx.complete();
        return;
      }

      setTransitioning(true);
      await new Promise((r) => setTimeout(r, 320));
      setIndex(index + 1);
      setRevealed(false);
      setAnimatedStat(null);
      setTransitioning(false);
    } finally {
      setBusy(false);
    }
  }

  const lastResult = results[index];
  const displayNextStat = revealed ? animatedStat ?? lastResult?.actualStat : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="chip bg-slate-100">Round {Math.min(index + 1, rounds)} / {rounds}</span>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">
            {CATEGORY_LABELS[category] || category}
          </span>
        </div>
        <StreakCounter streak={streak} bump={streakBump} />
      </div>

      <p className="text-center text-sm text-slate-500">
        Which has more <b className="text-slate-700">{statLabel}</b>?
      </p>

      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 transition-all duration-300 ${
        transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}>
        <Card emoji={current.emoji} name={current.name} stat={currentStat} label="has" state="known" />
        <Card
          emoji={next.emoji}
          name={next.name}
          stat={displayNextStat}
          label="has…"
          state={revealed ? (lastResult?.correct ? "correct" : "wrong") : "unknown"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="rounded-2xl bg-success-500 px-4 py-5 text-lg font-bold text-white shadow-soft transition
                     hover:bg-success-600 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.97]
                     disabled:opacity-40 disabled:hover:translate-y-0"
          onClick={() => choose("higher")}
          disabled={busy || revealed}
        >
          ▲ Higher
        </button>
        <button
          className="rounded-2xl bg-danger-500 px-4 py-5 text-lg font-bold text-white shadow-soft transition
                     hover:bg-danger-600 hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.97]
                     disabled:opacity-40 disabled:hover:translate-y-0"
          onClick={() => choose("lower")}
          disabled={busy || revealed}
        >
          ▼ Lower
        </button>
      </div>

      <div className="flex justify-center gap-1.5">
        {Array.from({ length: rounds }).map((_, i) => {
          const r = results[i];
          const cls = r?.correct ? "bg-success-500"
            : r && !r.correct ? "bg-danger-500"
            : i === index ? "bg-ink animate-pulse" : "bg-slate-200";
          return <span key={i} className={`h-2 w-7 rounded-full transition-colors ${cls}`} />;
        })}
      </div>
    </div>
  );
}

function StreakCounter({ streak, bump }) {
  if (streak === 0) return <span className="chip bg-slate-100 text-slate-500">No streak yet</span>;
  return (
    <div
      key={bump}
      className="inline-flex animate-pop items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-2 text-base font-bold text-white shadow-lift"
    >
      🔥 <span className="tabular-nums">{streak}</span>
      <span className="text-xs font-semibold text-white/80">streak</span>
    </div>
  );
}

function Card({ emoji, name, stat, label, state }) {
  const styling = {
    known: "ring-1 ring-slate-200 bg-white",
    unknown: "ring-2 ring-dashed ring-slate-300 bg-gradient-to-br from-slate-50 to-white",
    correct: "ring-2 ring-success-500 bg-success-50 animate-pop",
    wrong: "ring-2 ring-danger-500 bg-danger-50 animate-shake",
  }[state];
  const showQ = state === "unknown";
  return (
    <div className={`flex flex-col items-center gap-2 rounded-3xl p-8 transition-all duration-300 ${styling}`}>
      <div className="text-7xl select-none leading-none">{emoji}</div>
      <div className="text-center font-bold text-xl text-ink">{name}</div>
      <div className="text-center text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
      <div className={`text-4xl font-black tabular-nums transition-colors ${showQ ? "text-slate-300" : "text-ink"}`}>
        {showQ ? "—" : stat?.toLocaleString()}
      </div>
    </div>
  );
}
