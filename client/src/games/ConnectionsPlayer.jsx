import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

const COLORS = {
  yellow: "bg-amber-200 text-amber-900",
  green: "bg-emerald-200 text-emerald-900",
  blue: "bg-sky-200 text-sky-900",
  purple: "bg-violet-200 text-violet-900",
};

export default function ConnectionsPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { words: initialWords, maxMistakes, groupCount } = publicPuzzle;
  const [words, setWords] = useState(initialWords);
  const [selected, setSelected] = useState([]);
  const [solved, setSolved] = useState([]); // [{ theme, color, words }]
  const [mistakes, setMistakes] = useState(0);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(null); // "correct" | "wrong" | "close"
  const [msg, setMsg] = useState("");

  function toggle(w) {
    if (busy) return;
    if (selected.includes(w)) setSelected(selected.filter((x) => x !== w));
    else if (selected.length < 4) setSelected([...selected, w]);
  }

  async function submitGroup() {
    if (selected.length !== 4 || busy) return;
    setBusy(true);
    setMsg("");
    try {
      const { feedback } = await api.feedback(gameId, selected);
      if (feedback.correct) {
        sfx.correct();
        setFlash("correct");
        const solvedGroup = { theme: feedback.theme, color: feedback.color, words: [...selected] };
        const newSolved = [...solved, solvedGroup];
        setSolved(newSolved);
        setWords(words.filter((w) => !selected.includes(w)));
        setSelected([]);

        if (newSolved.length === groupCount) {
          await new Promise((r) => setTimeout(r, 700));
          await commit(newSolved, mistakes);
        }
      } else {
        sfx.wrong();
        setFlash(feedback.closeBy ? "close" : "wrong");
        setMsg(feedback.closeBy ? "One away!" : "Not quite.");
        const m = mistakes + 1;
        setMistakes(m);
        if (m >= maxMistakes) {
          await new Promise((r) => setTimeout(r, 700));
          await commit(solved, m);
        }
      }
      setTimeout(() => setFlash(null), 700);
    } finally {
      setBusy(false);
    }
  }

  async function commit(solvedList, mistakeCount) {
    await onSubmit(
      { solved: solvedList.map((s) => s.theme), mistakes: mistakeCount },
      {},
      Date.now() - startedAt
    );
  }

  const flashCls =
    flash === "correct"
      ? "ring-4 ring-emerald-400"
      : flash === "wrong"
      ? "ring-4 ring-rose-400 animate-shake"
      : flash === "close"
      ? "ring-4 ring-amber-400"
      : "";

  return (
    <div className="space-y-4">
      {solved.map((g, i) => (
        <div
          key={i}
          className={`rounded-xl p-3 text-center font-bold uppercase tracking-wide ${COLORS[g.color]} animate-fade-in`}
        >
          <div className="text-xs opacity-70">{g.theme}</div>
          <div className="mt-1 text-sm">{g.words.join(" · ")}</div>
        </div>
      ))}

      <div className={`grid grid-cols-4 gap-2 rounded-2xl p-1 transition-all ${flashCls}`}>
        {words.map((w) => {
          const isSel = selected.includes(w);
          return (
            <button
              key={w}
              onClick={() => toggle(w)}
              disabled={busy}
              className={`min-h-[64px] rounded-xl px-2 py-3 text-xs sm:text-sm font-bold uppercase transition-all active:scale-95 ${
                isSel ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900 hover:bg-slate-200"
              }`}
            >
              {w}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Mistakes: {Array.from({ length: maxMistakes }).map((_, i) => (
            <span key={i} className={i < mistakes ? "opacity-100" : "opacity-30"}>🔴</span>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setSelected([])} disabled={busy || selected.length === 0}>
            Clear
          </button>
          <button className="btn-primary" onClick={submitGroup} disabled={busy || selected.length !== 4}>
            Submit group
          </button>
        </div>
      </div>

      {msg && <p className="text-center text-sm text-slate-500">{msg}</p>}
    </div>
  );
}
