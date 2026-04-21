import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";

export default function WordlePlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { wordLen, maxGuesses } = publicPuzzle;
  const [current, setCurrent] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [tiles, setTiles] = useState([]); // [[state,...], ...]
  const [busy, setBusy] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [msg, setMsg] = useState("");

  const solved = tiles.length > 0 && tiles[tiles.length - 1].every((t) => t === "correct");
  const done = solved || guesses.length >= maxGuesses;

  // Keyboard input.
  useEffect(() => {
    function onKey(e) {
      if (busy || done) return;
      if (e.key === "Enter") submitRow();
      else if (e.key === "Backspace") setCurrent((c) => c.slice(0, -1));
      else if (/^[a-zA-Z]$/.test(e.key) && current.length < wordLen) {
        setCurrent((c) => (c + e.key.toUpperCase()).slice(0, wordLen));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, busy, done, guesses, wordLen]);

  async function submitRow() {
    if (current.length !== wordLen) {
      setMsg("Need " + wordLen + " letters");
      setShakeRow(true);
      setTimeout(() => setShakeRow(false), 400);
      return;
    }
    setMsg("");
    setBusy(true);
    try {
      const nextGuesses = [...guesses, current];
      const { feedback } = await api.feedback(gameId, nextGuesses);
      setTiles(feedback.tiles);
      setGuesses(nextGuesses);
      setCurrent("");
      const lastRow = feedback.tiles[feedback.tiles.length - 1];
      const rowSolved = lastRow.every((t) => t === "correct");
      rowSolved ? sfx.correct() : sfx.tick();

      if (rowSolved || nextGuesses.length >= maxGuesses) {
        // A brief pause then commit — gives the user time to see final tiles.
        await new Promise((r) => setTimeout(r, 600));
        await onSubmit(nextGuesses, {}, Date.now() - startedAt);
      }
    } finally {
      setBusy(false);
    }
  }

  // Build the 6 rows.
  const rows = [];
  for (let r = 0; r < maxGuesses; r++) {
    let word = "";
    let rowTiles = null;
    if (r < guesses.length) {
      word = guesses[r];
      rowTiles = tiles[r];
    } else if (r === guesses.length) {
      word = current.padEnd(wordLen, " ");
    } else {
      word = " ".repeat(wordLen);
    }
    rows.push({ word, rowTiles, isCurrent: r === guesses.length && !done });
  }

  return (
    <div className="space-y-4">
      <div className={`mx-auto grid gap-1.5`} style={{ width: "min(100%, 320px)" }}>
        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid gap-1.5 ${row.isCurrent && shakeRow ? "animate-shake" : ""}`}
            style={{ gridTemplateColumns: `repeat(${wordLen}, minmax(0, 1fr))` }}
          >
            {row.word.split("").map((ch, j) => (
              <Tile key={j} ch={ch} state={row.rowTiles?.[j]} filled={ch.trim() !== ""} />
            ))}
          </div>
        ))}
      </div>

      {msg && <p className="text-center text-sm text-rose-600">{msg}</p>}

      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-slate-500">Type on your keyboard or use the pad below.</div>
        <Keypad
          onKey={(k) => {
            if (busy || done) return;
            if (k === "ENTER") submitRow();
            else if (k === "BKSP") setCurrent((c) => c.slice(0, -1));
            else if (current.length < wordLen) setCurrent((c) => (c + k).slice(0, wordLen));
          }}
          tiles={tiles}
          guesses={guesses}
        />
      </div>
    </div>
  );
}

function Tile({ ch, state, filled }) {
  let cls = "bg-white ring-1 ring-slate-200 text-slate-900";
  if (state === "correct") cls = "bg-emerald-500 text-white ring-0";
  else if (state === "present") cls = "bg-amber-400 text-white ring-0";
  else if (state === "absent") cls = "bg-slate-400 text-white ring-0";
  else if (filled) cls = "bg-white ring-2 ring-slate-400 text-slate-900";
  return (
    <div
      className={`aspect-square flex items-center justify-center rounded-lg text-2xl font-bold uppercase transition-all duration-300 ${cls} ${
        state ? "animate-pop" : ""
      }`}
    >
      {ch.trim()}
    </div>
  );
}

const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

function Keypad({ onKey, tiles, guesses }) {
  // Compute best-known state per letter.
  const letterState = {};
  const order = { absent: 0, present: 1, correct: 2 };
  guesses.forEach((w, gi) => {
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];
      const s = tiles[gi]?.[i];
      if (!s) continue;
      if (!letterState[ch] || order[s] > order[letterState[ch]]) letterState[ch] = s;
    }
  });

  function cls(k) {
    const s = letterState[k];
    if (s === "correct") return "bg-emerald-500 text-white";
    if (s === "present") return "bg-amber-400 text-white";
    if (s === "absent") return "bg-slate-300 text-slate-600";
    return "bg-slate-100 text-slate-900 hover:bg-slate-200";
  }

  return (
    <div className="w-full max-w-md space-y-1.5">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1">
          {i === 2 && (
            <button onClick={() => onKey("ENTER")} className="rounded-md bg-slate-900 px-3 py-3 text-xs font-bold text-white">
              ENTER
            </button>
          )}
          {row.split("").map((k) => (
            <button key={k} onClick={() => onKey(k)} className={`flex-1 rounded-md py-3 text-sm font-bold transition ${cls(k)}`}>
              {k}
            </button>
          ))}
          {i === 2 && (
            <button onClick={() => onKey("BKSP")} className="rounded-md bg-slate-400 px-3 py-3 text-xs font-bold text-white">
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
