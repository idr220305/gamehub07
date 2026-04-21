import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.js";
import { getGameIcon } from "../games/index.js";
import Card from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import ProgressionCard from "../components/ProgressionCard.jsx";

export default function PlayerStats() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSession();
  const [stats, setStats] = useState(null);
  const [group, setGroup] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    Promise.all([api.stats(user.id, groupId), api.getGroup(groupId)])
      .then(([s, g]) => { setStats(s); setGroup(g); })
      .catch((e) => setErr(e.message));
  }, [groupId, user?.id]);

  if (err) return <div className="container-narrow section text-danger-600">{err}</div>;
  if (!stats || !group) {
    return (
      <div className="container-narrow section stack-y">
        <div className="skel h-24" />
        <div className="skel h-48" />
      </div>
    );
  }

  const perGameEntries = Object.entries(stats.perGame).sort((a, b) => b[1].avg - a[1].avg);

  return (
    <div className="container-narrow section stack-y animate-fade-in">
      <div>
        <Link to={`/group/${group.id}`} className="text-sm text-slate-500 hover:text-slate-900">
          ← {group.name}
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">My stats</h1>
        <p className="text-sm text-slate-500">In {group.name} · across {stats.daysPlayed} day{stats.daysPlayed === 1 ? "" : "s"}</p>
      </div>

      {stats.totalGames === 0 ? (
        <Card>
          <p className="text-slate-500">No plays yet. <Link to={`/group/${group.id}/games`} className="text-primary-600 font-semibold">Play today's games →</Link></p>
        </Card>
      ) : (
        <>
          <ProgressionCard userId={user.id} groupId={groupId} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Games played" value={stats.totalGames} />
            <StatTile label="Average score" value={stats.avgScore} />
            <StatTile label="Accuracy" value={`${Math.round(stats.accuracy * 100)}%`} />
            <StatTile label="Best streak" value={`${stats.bestStreak} 🔥`} />
          </div>

          <Card>
            <h3 className="mb-1 text-lg font-bold">Per-game breakdown</h3>
            <p className="mb-4 text-xs text-slate-500">Sorted by average score</p>
            <div className="space-y-3">
              {perGameEntries.map(([gameId, g]) => (
                <div key={gameId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getGameIcon(gameId)}</span>
                      <span className="font-semibold">{prettyName(gameId)}</span>
                      <Badge variant="outline" size="sm">{g.plays} play{g.plays === 1 ? "" : "s"}</Badge>
                    </div>
                    <span className="tabular-nums text-slate-600">
                      avg <b className="text-slate-900">{g.avg}</b> · best <b className="text-slate-900">{g.best}</b>
                    </span>
                  </div>
                  <ProgressBar value={Math.round(g.accuracy * 100)} max={100} variant="primary" size="sm" />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <Card variant="hover" padding="md">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black tabular-nums">{value}</div>
    </Card>
  );
}

const NAMES = {
  emoji: "Emoji Phrase",
  "higher-lower": "Higher or Lower",
  blur: "Blur Reveal",
  wordle: "Wordle",
  connections: "Connections",
  songless: "Songless",
  "flag-fragments": "Flag Fragments",
  "fake-fact": "Fake Fact",
  set: "Set",
  "precision-draw": "Precision Draw",
  "guess-year": "Guess the Year",
  "sound-guess": "Sound Guess",
};
function prettyName(id) {
  return NAMES[id] || id;
}
