import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.js";
import { getPlayer, getGameIcon } from "../games/index.js";
import ShareResults from "../components/ShareResults.jsx";
import PostGameSummary from "../components/PostGameSummary.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import Confetti from "../components/ui/Confetti.jsx";
import { sfx } from "../lib/sound.js";

const DIFF_VARIANT = { easy: "success", medium: "warn", hard: "danger" };

export default function DailyGames() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSession();
  const [group, setGroup] = useState(null);
  const [daily, setDaily] = useState(null);
  const [activeIdx, setActiveIdx] = useState(null);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [lastResult, setLastResult] = useState(null);
  const [confettiKey, setConfettiKey] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    Promise.all([api.getGroup(groupId), api.getDaily(user.id, groupId)])
      .then(([g, d]) => {
        setGroup(g); setDaily(d);
        const firstUnplayed = d.games.findIndex((x) => !x.submitted);
        setActiveIdx(firstUnplayed === -1 ? 0 : firstUnplayed);
        setStartedAt(Date.now());
      })
      .catch((e) => setErr(e.message));
  }, [groupId, user?.id]);

  const activeGame = activeIdx != null ? daily?.games[activeIdx] : null;
  const Player = activeGame ? getPlayer(activeGame.id) : null;
  const allPlayed = useMemo(() => daily?.games.every((g) => g.submitted), [daily]);
  const playedCount = daily?.games.filter((g) => g.submitted).length || 0;
  const dailyTotal = useMemo(
    () => (daily?.games || []).reduce((s, g) => s + (g.submission?.score || 0), 0),
    [daily]
  );

  async function handleSubmit(input, clientCtx, timeTaken) {
    const res = await api.submit({
      userId: user.id, groupId, gameId: activeGame.id,
      input, timeTaken, clientCtx,
    });
    setLastResult({ ...res, gameId: activeGame.id, timeTaken });
    const fresh = await api.getDaily(user.id, groupId);
    setDaily(fresh);
    if (fresh.games.every((g) => g.submitted)) {
      sfx.complete();
      setConfettiKey(Date.now());
    }
    return res;
  }

  function moveTo(i) { setActiveIdx(i); setStartedAt(Date.now()); setLastResult(null); }
  function nextUnplayed() {
    if (!daily) return;
    const next = daily.games.findIndex((x, i) => i !== activeIdx && !x.submitted);
    if (next !== -1) moveTo(next);
    else setLastResult(null);
  }

  if (err) return <div className="container-narrow section text-danger-600">{err}</div>;
  if (!daily || !group) {
    return <div className="container-narrow section"><div className="skel h-64" /></div>;
  }

  const submissionsByGame = {};
  for (const g of daily.games) if (g.submitted) submissionsByGame[g.id] = g.submission;
  const showResult = lastResult && lastResult.gameId === activeGame?.id;

  return (
    <div className="container-narrow section stack-y animate-fade-in">
      {/* Header + progress */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <Link to={`/group/${group.id}`} className="text-sm text-slate-500 hover:text-slate-900">
            ← {group.name}
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Today's games</h1>
          <p className="text-sm text-slate-500">{daily.date} · one shot per game</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="btn-ghost text-xs"
            title="Toggle focus mode"
          >
            {focusMode ? "✕ Exit focus" : "🎯 Focus"}
          </button>
          <Link to={`/group/${group.id}/leaderboard`}>
            <Button variant="ghost">Leaderboard →</Button>
          </Link>
        </div>
      </div>

      {!focusMode && (
        <Card padding="md">
          <ProgressBar
            value={playedCount}
            max={daily.games.length}
            variant="primary"
            size="md"
            label={`Progress today`}
            showValue
          />
        </Card>
      )}

      {!focusMode && <GameTabs games={daily.games} active={activeIdx} onPick={moveTo} />}

      {focusMode && (
        <div className="flex justify-center">
          <span className="chip bg-slate-100">
            {getGameIcon(activeGame?.id)} {activeGame?.name} · Round {playedCount + 1}/{daily.games.length}
          </span>
        </div>
      )}

      <div key={activeGame?.id} className="animate-scale-in">
        {activeGame && !activeGame.submitted && !showResult && Player && (
          <Card padding="lg">
            <div className="mb-5 flex items-start gap-3">
              <div className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-slate-100 text-2xl ring-1 ring-slate-200">
                {getGameIcon(activeGame.id)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold leading-tight">{activeGame.name}</h2>
                  <Badge variant={DIFF_VARIANT[activeGame.difficulty] || "neutral"} size="sm">
                    {activeGame.difficulty}
                  </Badge>
                  {activeGame.isDailyDouble && (
                    <Badge variant="warn" size="sm">⭐ Daily double — 2× points</Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">{activeGame.description}</p>
              </div>
            </div>
            <Player
              gameId={activeGame.id}
              publicPuzzle={activeGame.publicPuzzle}
              onSubmit={handleSubmit}
              startedAt={startedAt}
            />
          </Card>
        )}

        {activeGame && showResult && (
          <div className="space-y-4">
            <PostGameSummary
              game={activeGame}
              submission={lastResult.submission}
              stats={lastResult.stats}
              revealAnswer={
                <div className="space-y-1">
                  <div><ResultDetails gameId={activeGame.id} submission={lastResult.submission} /></div>
                  <div className="text-xs text-slate-500">
                    ⏱ {formatTime(lastResult.timeTaken)}
                    {lastResult.stats?.doubled && <span className="ml-2 text-warn-600 font-semibold">⭐ Doubled</span>}
                  </div>
                </div>
              }
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setLastResult(null)}>Review again</Button>
              {daily.games.some((g, i) => i !== activeIdx && !g.submitted) ? (
                <Button variant="accent" onClick={nextUnplayed}>Next game →</Button>
              ) : (
                <Link to={`/group/${group.id}/leaderboard`}>
                  <Button variant="accent">See leaderboard →</Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {activeGame && activeGame.submitted && !showResult && (
          <SubmittedSummary game={activeGame} />
        )}
      </div>

      {allPlayed && (
        <>
          <div className="relative overflow-hidden">
            <Confetti trigger={confettiKey} />
            <Card variant="success" padding="lg">
              <div className="flex items-center gap-4">
                <div className="text-5xl animate-pop">🎉</div>
                <div>
                  <h2 className="text-xl font-extrabold text-success-700">All games done for today</h2>
                  <p className="text-sm text-success-700/80">
                    Base total <b className="tabular-nums">{dailyTotal}</b> · check leaderboard for bonus points.
                  </p>
                </div>
              </div>
            </Card>
          </div>
          <ShareResults
            date={daily.date}
            groupName={group.name}
            submissions={submissionsByGame}
            games={daily.games}
            user={user}
            groupId={groupId}
          />
        </>
      )}
    </div>
  );
}

function formatTime(ms) {
  if (!ms) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function GameTabs({ games, active, onPick }) {
  return (
    <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
      {games.map((g, i) => {
        const isActive = i === active;
        return (
          <button
            key={g.id}
            onClick={() => onPick(i)}
            className={`flex flex-none items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 transition-all duration-200 ${
              isActive
                ? "bg-ink text-white ring-ink shadow-soft"
                : g.submitted
                ? "bg-success-50 text-success-700 ring-success-100 hover:bg-success-100"
                : "bg-white text-ink ring-slate-200 hover:bg-slate-50 hover:-translate-y-0.5"
            }`}
          >
            <span className="text-base">{getGameIcon(g.id)}</span>
            <span>{g.name}</span>
            {g.isDailyDouble && <span className="ml-0.5 rounded bg-warn-500 px-1 text-[10px] font-bold text-white">2×</span>}
            {g.submitted && (
              <span className="tabular-nums opacity-70">{g.submission.score}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ResultDetails({ gameId, submission }) {
  const m = submission.metadata || {};
  if (gameId === "emoji") return <>Answer: <b>{m.answer}</b>. Solved in {m.guesses} guess{m.guesses === 1 ? "" : "es"}.</>;
  if (gameId === "higher-lower") return <>Streak: <b>{m.streak}</b> correct in a row.</>;
  if (gameId === "wordle") return <>Word: <b>{m.answer}</b>. {m.solvedIn ? `Solved in ${m.solvedIn}.` : "Not solved."}</>;
  if (gameId === "connections") return <>Solved {m.solved?.length || 0} of 4 groups with {m.mistakes} mistake{m.mistakes === 1 ? "" : "s"}.</>;
  if (gameId === "songless") return <>Answer: <b>{m.answer}</b>. Hints used: {m.hintsUsed}.</>;
  if (gameId === "flag-fragments") return <>Answer: <b>{m.answer}</b>.</>;
  if (gameId === "fake-fact") return <>The fake was statement <b>{"ABC"[m.fakeIndex]}</b>. {m.explain}</>;
  if (gameId === "set") return <>Attempts: {m.attempts}.</>;
  if (gameId === "precision-draw") return <>Similarity: {Math.round((m.similarity || 0) * 100)}%.</>;
  if (gameId === "which-first") return <>Earlier: <b>{m.earlierSide === "left" ? `left (${m.leftYear})` : `right (${m.rightYear})`}</b>. Other event: {m.earlierSide === "left" ? m.rightYear : m.leftYear}.</>;
  if (gameId === "sound-guess") return <>Answer: <b>{m.answer}</b>. Plays used: {m.plays}.</>;
  if (gameId === "sound-guess") return <>Answer: <b>{m.answer}</b>. Plays used: {m.plays}.</>;
  return null;
}

function SubmittedSummary({ game }) {
  return (
    <Card padding="lg">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-slate-100 text-2xl ring-1 ring-slate-200">
          {getGameIcon(game.id)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">{game.name}</h2>
            <Badge variant={DIFF_VARIANT[game.difficulty] || "neutral"} size="sm">{game.difficulty}</Badge>
            {game.isDailyDouble && <Badge variant="warn" size="sm">2×</Badge>}
          </div>
          <p className="text-sm text-slate-500">Already played — come back tomorrow.</p>
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-5xl font-black tabular-nums">{game.submission.score}</div>
        <div className="text-slate-500">/ {game.maxScore}</div>
      </div>
      <div className="mt-1 text-xs text-slate-500">
        <ResultDetails gameId={game.id} submission={game.submission} />
        {game.submission.timeTaken > 0 && <span className="ml-2">⏱ {formatTime(game.submission.timeTaken)}</span>}
      </div>
    </Card>
  );
}
