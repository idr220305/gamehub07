import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.js";
import { getGameIcon } from "../games/index.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import ProgressionCard from "../components/ProgressionCard.jsx";

const DIFF_VARIANT = { easy: "success", medium: "warn", hard: "danger" };

export default function GroupDashboard() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSession();
  const [group, setGroup] = useState(null);
  const [daily, setDaily] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [activity, setActivity] = useState([]);
  const [err, setErr] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    Promise.all([
      api.getGroup(groupId),
      api.getDaily(user.id, groupId),
      api.leaderboard(groupId),
      api.activity(groupId, 12),
    ])
      .then(([g, d, lb, act]) => { setGroup(g); setDaily(d); setLeaderboard(lb); setActivity(act); })
      .catch((e) => setErr(e.message));
  }, [groupId, user?.id]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  if (err) return <div className="container-narrow section text-danger-600">{err}</div>;
  if (!group || !daily || !leaderboard) {
    return (
      <div className="container-app section stack-y">
        <div className="skel h-28" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="skel h-24" />
          <div className="skel h-24" />
          <div className="skel h-24" />
        </div>
        <div className="skel h-64" />
      </div>
    );
  }

  const playedCount = daily.games.filter((g) => g.submitted).length;
  const totalCount = daily.games.length;
  const me = leaderboard.daily.find((r) => r.userId === user.id);
  const myAllTime = leaderboard.allTime.find((r) => r.userId === user.id);
  const leader = leaderboard.allTime[0];
  const isLeaderMe = leader?.userId === user.id;

  return (
    <div className="container-app section stack-y animate-fade-in">
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{group.name}</h1>
            {isLeaderMe && <Badge variant="warn" size="lg">👑 You're #1</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{group.members.length} members</span>
            <span>·</span>
            <button onClick={copyInvite} className="chip cursor-pointer hover:bg-slate-200 transition">
              Invite code <span className="font-mono font-bold">{group.inviteCode}</span>
              <span className="ml-1 text-slate-400">{copied ? "copied!" : "📋"}</span>
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/group/${group.id}/leaderboard`}>
            <Button variant="secondary">Leaderboard</Button>
          </Link>
          {group.alliancesEnabled && (
            <Link to={`/group/${group.id}/alliances`}>
              <Button variant="secondary">🤝 Alliances</Button>
            </Link>
          )}
          <Link to={`/group/${group.id}/stats`}>
            <Button variant="secondary">My stats</Button>
          </Link>
          {(!group.createdByUserId || group.createdByUserId === user.id) && (
            <Link to={`/group/${group.id}/settings`}>
              <Button variant="secondary">⚙️ Settings</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Big primary CTA: today */}
      <Card variant="accent" padding="lg">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-primary-600 text-2xl text-white shadow-soft">
              🎯
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-primary-700">Today's hub</div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                {playedCount === totalCount ? "All games done — 🎉" : `${playedCount} of ${totalCount} played`}
              </h2>
              <p className="text-sm text-slate-600">
                {daily.dailyDouble && (
                  <>Double points today on <b>{daily.games.find((g) => g.id === daily.dailyDouble)?.name}</b>. </>
                )}
                Same puzzles for everyone. One shot per game.
              </p>
            </div>
          </div>
          <Link to={`/group/${group.id}/games`}>
            <Button variant="accent" size="xl" className="w-full sm:w-auto">
              {playedCount === totalCount ? "Review today" : "▶ Play today's games"}
            </Button>
          </Link>
        </div>
        <div className="mt-4">
          <ProgressBar
            value={playedCount}
            max={totalCount}
            variant="primary"
            size="md"
            label="Progress"
            showValue
          />
        </div>
      </Card>

      {/* Stat cards */}
      <ProgressionCard userId={user.id} groupId={groupId} compact />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBlock label="Your streak" value={`${me?.streak ?? 0}`} suffix="🔥" hint="consecutive days" />
        <StatBlock
          label="Your rank"
          value={`#${myAllTime?.rank ?? "—"}`}
          hint={
            myAllTime?.rankDelta > 0 ? <span className="text-success-600">↑ +{myAllTime.rankDelta} since yesterday</span>
            : myAllTime?.rankDelta < 0 ? <span className="text-danger-600">↓ {Math.abs(myAllTime.rankDelta)} since yesterday</span>
            : "no change"
          }
        />
        <StatBlock label="Your all-time" value={myAllTime?.allTime ?? 0} hint="total points" />
      </div>

      {/* Two-column main: games + side */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Today's games */}
        <Card padding="md" className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">Today's games</h3>
            <Badge variant="outline" size="sm">{daily.date}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {daily.games.map((g) => (
              <Link
                key={g.id}
                to={`/group/${group.id}/games`}
                className={`group flex items-center justify-between rounded-xl px-3 py-3 ring-1 transition-all duration-200 hover:-translate-y-0.5 ${
                  g.submitted
                    ? "bg-success-50 ring-success-100 hover:shadow-soft"
                    : "bg-slate-50 ring-slate-200 hover:bg-white hover:shadow-soft"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white text-xl ring-1 ring-slate-200 transition group-hover:scale-110">
                    {getGameIcon(g.id)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold">{g.name}</span>
                      {g.isDailyDouble && <Badge variant="warn" size="sm">2×</Badge>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Badge variant={DIFF_VARIANT[g.difficulty] || "neutral"} size="sm">{g.difficulty}</Badge>
                      <span className="truncate">{g.description}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-2 flex-none">
                  {g.submitted ? (
                    <Badge variant="success" size="md">✓ {g.submission.score}</Badge>
                  ) : (
                    <Badge variant="ink" size="md">Play →</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Side stack: players + activity */}
        <div className="space-y-5">
          <Card padding="md">
            <h3 className="mb-3 text-lg font-bold">Players</h3>
            <ul className="space-y-2">
              {leaderboard.allTime.slice(0, 8).map((p, i) => (
                <li
                  key={p.userId}
                  className={`flex items-center justify-between rounded-xl px-2 py-2 transition ${
                    p.userId === user.id ? "bg-primary-50" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={p.displayName} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate font-semibold">
                        {p.displayName}
                        {i === 0 && <span title="Group leader">👑</span>}
                        {p.userId === user.id && <span className="text-xs text-slate-500">(you)</span>}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.streak > 0 && <span className="mr-1.5">🔥 {p.streak}</span>}
                        <span className="tabular-nums">{p.allTime} pts</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 tabular-nums">#{p.rank}</div>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="md">
            <h3 className="mb-3 text-lg font-bold">Activity</h3>
            <ActivityFeed activity={activity} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, suffix, hint }) {
  return (
    <Card variant="hover" padding="md">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="text-3xl font-black tabular-nums">{value}</div>
        {suffix && <div className="text-xl">{suffix}</div>}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </Card>
  );
}

function ActivityFeed({ activity }) {
  if (!activity || activity.length === 0) {
    return <p className="text-sm text-slate-500">No activity yet — be the first to play.</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {activity.map((a) => {
        const correct = a.score > 0;
        const text = correct
          ? `scored ${a.score} on ${a.gameName}`
          : `tried ${a.gameName}`;
        return (
          <li key={a.id} className="flex items-center gap-3">
            <Avatar name={a.displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate">
                <b>{a.displayName}</b>{" "}
                <span className="text-slate-600">{text}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {timeAgo(new Date(a.createdAt))}
              </div>
            </div>
            {correct && <Badge variant="success" size="sm">+{a.score}</Badge>}
          </li>
        );
      })}
    </ul>
  );
}

function timeAgo(d) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
