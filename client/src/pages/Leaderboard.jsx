import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.js";
import { getGameIcon } from "../games/index.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Avatar from "../components/ui/Avatar.jsx";

const TABS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "allTime", label: "All-time" },
];

export default function Leaderboard() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSession();
  const [group, setGroup] = useState(null);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("daily");
  const [myDaily, setMyDaily] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    Promise.all([
      api.getGroup(groupId),
      api.leaderboard(groupId),
      api.getDaily(user.id, groupId),
    ])
      .then(([g, lb, d]) => { setGroup(g); setData(lb); setMyDaily(d); })
      .catch((e) => setErr(e.message));
  }, [groupId, user?.id]);

  if (err) return <div className="container-narrow section text-danger-600">{err}</div>;
  if (!data || !group || !myDaily) {
    return <div className="container-narrow section"><div className="skel h-64" /></div>;
  }

  const rows = data[tab];
  const myUnfinished = myDaily.games.some((g) => !g.submitted);
  const ddGame = myDaily.games.find((g) => g.id === data.dailyDouble);

  return (
    <div className="container-narrow section stack-y animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={`/group/${group.id}`} className="text-sm text-slate-500 hover:text-slate-900">
            ← {group.name}
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-slate-500">
            Week starting {data.weekStart} · today is {data.date}
            {ddGame && <> · ⭐ Daily double: <b>{ddGame.name}</b></>}
          </p>
        </div>
        <Link to={`/group/${group.id}/games`}>
          <Button variant="accent">{myUnfinished ? "Finish today" : "Review today"}</Button>
        </Link>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ring-1 transition-all duration-200 ${
              tab === t.id
                ? "bg-ink text-white ring-ink shadow-soft"
                : "bg-white text-ink ring-slate-200 hover:bg-slate-50 hover:-translate-y-0.5"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 w-10">#</th>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3 text-right">Score</th>
              {tab === "daily" && <th className="px-4 py-3 text-right hidden sm:table-cell">Games</th>}
              {tab === "allTime" && <th className="px-4 py-3 text-right hidden sm:table-cell">Δ</th>}
              <th className="px-4 py-3 text-right">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => {
              const leader = rows[0];
              const gap = leader ? leader[tab] - r[tab] : 0;
              const isWeeklyWinner = tab === "weekly" && i === 0 && r[tab] > 0;
              return (
              <tr key={r.userId} className={`${r.userId === user.id ? "bg-primary-50/50" : ""} ${isWeeklyWinner ? "bg-gradient-to-r from-warn-50 via-amber-50 to-warn-50" : ""}`}>
                <td className="px-4 py-3">
                  <span className="font-mono text-slate-500">{medal(i)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.displayName} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate font-semibold">
                        {r.displayName}
                        {i === 0 && tab === "allTime" && <span title="Leader">👑</span>}
                        {isWeeklyWinner && <Badge variant="warn" size="sm">This week's winner</Badge>}
                      </div>
                      <div className="text-xs text-slate-500">
                        @{r.username}
                        {gap > 0 && i > 0 && <span className="ml-1.5 text-slate-400">· −{gap} from leader</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold">{r[tab]}</td>
                {tab === "daily" && (
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500 hidden sm:table-cell">
                    {r.dailyGamesPlayed}/{myDaily.games.length}
                  </td>
                )}
                {tab === "allTime" && (
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <RankDelta delta={r.rankDelta} />
                  </td>
                )}
                <td className="px-4 py-3 text-right">{r.streak > 0 ? <span>{r.streak} 🔥</span> : <span className="text-slate-400">—</span>}</td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {tab === "daily" && (
        <Card>
          <h3 className="mb-3 font-bold">Today's per-game breakdown</h3>
          {myUnfinished ? (
            <p className="text-sm text-slate-500">
              Finish all of today's games to see how everyone did. (No spoilers!)
            </p>
          ) : (
            <DailyBreakdown
              games={myDaily.games}
              dailyDetails={data.dailyDetails}
              members={group.members}
            />
          )}
        </Card>
      )}

      {tab === "daily" && (
        <Card>
          <h3 className="mb-2 font-bold">Bonuses</h3>
          <ul className="space-y-1 text-sm">
            {rows.map((r) =>
              r.dailyBonuses.length ? (
                <li key={r.userId}>
                  <b>{r.displayName}:</b>{" "}
                  {r.dailyBonuses.map((b, i) => (
                    <Badge key={i} variant="warn" size="sm" className="mr-1">+{b.points} {b.label}</Badge>
                  ))}
                </li>
              ) : null
            )}
            {rows.every((r) => !r.dailyBonuses.length) && (
              <li className="text-sm text-slate-500">No bonuses earned today (yet).</li>
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}

function medal(i) {
  return ["🥇", "🥈", "🥉"][i] ?? `${i + 1}`;
}

function RankDelta({ delta }) {
  if (delta == null || delta === 0) return <span className="text-slate-400">—</span>;
  if (delta > 0) return <span className="font-semibold text-success-600">↑ +{delta}</span>;
  return <span className="font-semibold text-danger-600">↓ {Math.abs(delta)}</span>;
}

function DailyBreakdown({ games, dailyDetails, members }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="py-2 pr-4">Player</th>
            {games.map((g) => (
              <th key={g.id} className="py-2 pr-4 text-right">
                <span className="mr-1">{getGameIcon(g.id)}</span>{g.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((m) => (
            <tr key={m.id}>
              <td className="py-2 pr-4">
                <div className="flex items-center gap-2">
                  <Avatar name={m.user.displayName} size="sm" />
                  <span className="font-semibold">{m.user.displayName}</span>
                </div>
              </td>
              {games.map((g) => {
                const s = dailyDetails[m.userId]?.[g.id];
                return (
                  <td key={g.id} className="py-2 pr-4 text-right tabular-nums">
                    {s ? `${s.score}/${s.maxScore}` : <span className="text-slate-300">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
