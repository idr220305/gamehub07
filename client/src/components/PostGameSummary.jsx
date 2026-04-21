import { useEffect, useState } from "react";
import Card from "./ui/Card.jsx";
import Badge from "./ui/Badge.jsx";
import ProgressBar from "./ui/ProgressBar.jsx";
import Confetti from "./ui/Confetti.jsx";

export default function PostGameSummary({ game, submission, stats, revealAnswer }) {
  const score = submission.score;
  const max = submission.maxScore;
  const correct = score > 0;
  const isPerfect = correct && score === max;
  const [confettiKey, setConfettiKey] = useState(null);

  useEffect(() => {
    if (isPerfect) setConfettiKey(Date.now());
  }, [isPerfect]);

  return (
    <div className="relative">
      {isPerfect && <Confetti trigger={confettiKey} count={40} />}
      <Card variant={correct ? "success" : "default"} padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-slate-500">{game.name}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <div className={`text-6xl font-black tabular-nums ${isPerfect ? "animate-pop" : ""}`}>
                {score}
              </div>
              <div className="text-lg font-semibold text-slate-400">/ {max}</div>
            </div>
            <div className={`mt-1 text-sm font-semibold ${correct ? "text-success-700" : "text-danger-600"}`}>
              {isPerfect ? "✨ Perfect Run!" : correct ? "✓ Nice one" : "✗ Not quite"}
            </div>
          </div>
          <div className="text-right">
            <RankPill rank={stats?.rank} total={stats?.submittersInGroup} />
            <div className="mt-2 text-xs text-slate-500">
              {stats?.groupCorrectPct != null && `${stats.groupCorrectPct}% of group scored today`}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <ProgressBar
            value={score} max={max}
            variant={correct ? "success" : "danger"}
            track="light" size="md"
          />
        </div>

        {/* Rival */}
        {stats?.rival && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/80 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span>
                <b>{stats.rival.displayName}</b> is <b className="text-danger-600">{stats.rival.gap}</b> pts ahead today
              </span>
            </div>
          </div>
        )}

        {/* XP earned */}
        {stats?.xpEarned > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white">
            +{stats.xpEarned} XP
          </div>
        )}

        {revealAnswer != null && (
          <div className="mt-4 rounded-xl bg-white/80 px-4 py-3 text-sm">{revealAnswer}</div>
        )}
      </Card>
    </div>
  );
}

function RankPill({ rank, total }) {
  if (!rank) return null;
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <Badge variant="outline" size="lg">
      {medal && <span>{medal}</span>}
      <span>Rank <b className="tabular-nums">{rank}</b><span className="text-slate-400"> / {total}</span></span>
    </Badge>
  );
}
