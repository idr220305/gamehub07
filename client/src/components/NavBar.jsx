import { Link, useLocation, useNavigate, matchPath } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSession, clearSession } from "../lib/session.js";
import { soundEnabled, setSoundEnabled } from "../lib/sound.js";
import { api } from "../lib/api.js";
import Avatar from "./ui/Avatar.jsx";
import ConfirmDialog from "./ui/ConfirmDialog.jsx";
import { toast } from "./ui/Toast.jsx";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSession();
  const [snd, setSnd] = useState(soundEnabled());
  const [stats, setStats] = useState(null);
  const [group, setGroup] = useState(null);
  const [daily, setDaily] = useState(null);
  const [confirmOut, setConfirmOut] = useState(false);

  // Extract groupId from URL when inside a group context.
  const m = matchPath("/group/:groupId/*", location.pathname) || matchPath("/group/:groupId", location.pathname);
  const groupId = m?.params?.groupId;

  // Load contextual data (stats / daily progress / group name).
  useEffect(() => {
    if (!user || !groupId) { setStats(null); setGroup(null); setDaily(null); return; }
    let stale = false;
    Promise.all([
      api.stats(user.id, groupId).catch(() => null),
      api.getGroup(groupId).catch(() => null),
      api.getDaily(user.id, groupId).catch(() => null),
    ]).then(([s, g, d]) => {
      if (stale) return;
      setStats(s); setGroup(g); setDaily(d);
    });
    return () => { stale = true; };
  }, [user?.id, groupId, location.pathname]);

  function toggleSound() { const next = !snd; setSoundEnabled(next); setSnd(next); }

  function doSignOut() {
    setConfirmOut(false);
    clearSession();          // cache cleared, listeners notified
    setStats(null);          // clear local nav data immediately
    setGroup(null);
    setDaily(null);
    toast("Signed out — see you tomorrow!", { kind: "success" });
    navigate("/", { replace: true });
  }

  const playedCount = daily?.games.filter((g) => g.submitted).length || 0;
  const totalCount = daily?.games.length || 0;
  const todayScore = (daily?.games || []).reduce((s, g) => s + (g.submission?.score || 0), 0);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="container-app flex items-center justify-between gap-3 py-3">
          <Link to="/" className="flex items-center gap-2 flex-none">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-lg shadow-soft">🎮</span>
            <span className="hidden text-base font-bold tracking-tight sm:inline">Daily Games Hub</span>
          </Link>

          {/* Contextual stats — shown when inside a group */}
          {user && groupId && (
            <div className="hidden md:flex items-center gap-2 text-xs">
              {group && (
                <Link to={`/group/${group.id}`} className="chip hover:bg-slate-200">
                  📍 {group.name}
                </Link>
              )}
              {totalCount > 0 && (
                <span className="chip">
                  {playedCount}/{totalCount} today
                </span>
              )}
              {todayScore > 0 && (
                <span className="chip bg-primary-50 text-primary-700">
                  +{todayScore} pts
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {user && stats?.currentStreak > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-3 py-1.5 text-sm font-bold text-white shadow-soft">
                🔥 <span className="tabular-nums">{stats.currentStreak}</span>
              </span>
            )}
            <button className="btn-ghost" onClick={toggleSound} title="Toggle sound" aria-label="Toggle sound">
              {snd ? "🔊" : "🔇"}
            </button>
            {user && (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <Avatar name={user.displayName} size="md" />
                  <span className="text-sm font-semibold">{user.displayName}</span>
                </div>
                <button
                  className="btn-secondary text-xs"
                  onClick={() => setConfirmOut(true)}
                  title="Sign out"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={confirmOut}
        title="Sign out?"
        body={user && <>You're signed in as <b>{user.displayName}</b>. You can sign back in any time.</>}
        confirmLabel="Sign out"
        confirmVariant="danger"
        onConfirm={doSignOut}
        onCancel={() => setConfirmOut(false)}
      />
    </>
  );
}
