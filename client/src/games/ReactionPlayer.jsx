import { useEffect, useRef, useState } from "react";
import { sfx } from "../lib/sound.js";
import GameIntro from "../components/GameIntro.jsx";

// Phases: intro → armed → go → done | falseStart
//
// Bug fix: phase is read from a ref inside the click dispatcher so we never
// act on stale state when React hasn't flushed yet. A single onClick handler
// dispatches based on the live phase.
export default function ReactionPlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const { waitMs } = publicPuzzle;
  const [phase, setPhase] = useState("intro");
  const phaseRef = useRef("intro");
  const [reactionMs, setReactionMs] = useState(null);
  const [busy, setBusy] = useState(false);
  const goAt = useRef(0);
  const timer = useRef(null);

  function go(next) {
    phaseRef.current = next;
    setPhase(next);
  }

  function arm() {
    clearTimeout(timer.current);
    go("armed");
    setReactionMs(null);
    // Small jitter on top of waitMs so repeat-plays never feel identical.
    const extra = Math.floor(Math.random() * 400);
    timer.current = setTimeout(() => {
      if (phaseRef.current !== "armed") return; // user already clicked early
      goAt.current = performance.now();
      go("go");
      sfx.tick();
    }, waitMs + extra);
  }

  function onClickDispatch() {
    if (busy) return;
    const p = phaseRef.current;
    if (p === "armed") {
      clearTimeout(timer.current);
      go("falseStart");
      sfx.wrong();
      commit(0, true);
      return;
    }
    if (p === "go") {
      const ms = Math.round(performance.now() - goAt.current);
      setReactionMs(ms);
      go("done");
      sfx.correct();
      commit(ms, false);
      return;
    }
    // idle / done / falseStart → re-arm for a fresh round (user can retry until they commit… actually we always commit after first tap, so this case won't normally fire).
  }

  async function commit(ms, falseStart) {
    setBusy(true);
    try {
      await onSubmit(falseStart ? 0 : ms, { falseStart }, Date.now() - startedAt);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  if (phase === "intro") {
    return (
      <GameIntro
        title="Reaction Time"
        rules={[
          "Wait for the screen to flash GREEN.",
          "Tap as fast as you can when it does.",
          "Tapping during the red/orange wait screen = false start.",
          "Faster reaction = more points.",
        ]}
        warning="Only one attempt. Get ready first."
        startLabel="Start test"
        onStart={arm}
      />
    );
  }

  const bg =
    phase === "armed" ? "bg-gradient-to-br from-amber-400 to-orange-500" :
    phase === "go" ? "bg-gradient-to-br from-success-400 to-success-600" :
    phase === "falseStart" ? "bg-gradient-to-br from-danger-400 to-danger-600 animate-shake" :
    phase === "done" ? "bg-gradient-to-br from-sky-400 to-indigo-500" :
    "bg-slate-200";

  const label =
    phase === "armed" ? "Wait for green…" :
    phase === "go" ? "TAP NOW!" :
    phase === "falseStart" ? "Too early!" :
    phase === "done" ? `${reactionMs} ms` :
    "";

  return (
    <div className="space-y-5">
      <button
        onClick={onClickDispatch}
        disabled={phase === "done" || phase === "falseStart" || busy}
        className={`${bg} mx-auto block aspect-[3/2] w-full max-w-md select-none touch-none rounded-3xl px-4 text-3xl font-black text-white shadow-lift transition-colors duration-100 active:scale-[0.98] disabled:opacity-90`}
        aria-label="Reaction test surface"
      >
        {label}
      </button>

      {phase === "done" && (
        <div className="text-center text-sm text-slate-500">
          Reaction: <b className="text-slate-900 tabular-nums">{reactionMs} ms</b>
        </div>
      )}
      {phase === "falseStart" && (
        <div className="text-center text-sm text-danger-600">You tapped before green. No points.</div>
      )}
    </div>
  );
}
