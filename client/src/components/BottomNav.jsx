import { Link, useLocation, matchPath } from "react-router-dom";
import { useSession } from "../lib/session.js";

// Sticky bottom tab bar for mobile.
// Only visible on small screens (sm:hidden) and when the user is inside a group context.
// Tabs: Games · Leaderboard · Group · Profile (alliances if enabled — shown in the Group tab area)
export default function BottomNav() {
  const location = useLocation();
  const user = useSession();
  if (!user) return null;

  const m = matchPath("/group/:groupId/*", location.pathname) || matchPath("/group/:groupId", location.pathname);
  const groupId = m?.params?.groupId;
  if (!groupId) return null;

  const path = location.pathname;
  const tabs = [
    { id: "games", label: "Play", icon: "🎮", to: `/group/${groupId}/games`, match: `/group/${groupId}/games` },
    { id: "leaderboard", label: "Ranks", icon: "🏆", to: `/group/${groupId}/leaderboard`, match: `/group/${groupId}/leaderboard` },
    { id: "group", label: "Group", icon: "👥", to: `/group/${groupId}`, match: `/group/${groupId}`, exact: true },
    { id: "stats", label: "You", icon: "📊", to: `/group/${groupId}/stats`, match: `/group/${groupId}/stats` },
  ];

  function isActive(tab) {
    if (tab.exact) return path === tab.match;
    return path.startsWith(tab.match);
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = isActive(t);
          return (
            <li key={t.id} className="flex">
              <Link
                to={t.to}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
                  active ? "text-primary-600" : "text-slate-500"
                }`}
              >
                <span className={`text-xl transition-transform ${active ? "scale-110" : ""}`}>{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
