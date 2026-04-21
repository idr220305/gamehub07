import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import Card from "./ui/Card.jsx";
import Badge from "./ui/Badge.jsx";
import ProgressBar from "./ui/ProgressBar.jsx";

// Loads and renders user progression (level + XP + achievements).
// Used in Group Dashboard + Player Stats.
export default function ProgressionCard({ userId, groupId, compact = false }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    api.progression(userId, groupId).then((d) => { if (!stale) setData(d); }).catch(() => {});
    return () => { stale = true; };
  }, [userId, groupId]);

  if (!data) return <div className="skel h-28" />;

  const { level, achievements } = data;

  return (
    <Card padding="md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-xl font-black text-white shadow-lift">
            {level.level}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">Level</div>
            <div className="text-lg font-bold">{level.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-slate-500">XP</div>
          <div className="text-xl font-black tabular-nums">{level.xp}</div>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar
          value={level.xpIntoLevel}
          max={level.xpIntoLevel + level.xpToNext || 1}
          variant="primary"
          size="md"
          label={level.nextName ? `→ ${level.nextName}` : "Max level"}
          showValue={!!level.nextName}
        />
      </div>

      {!compact && (
        <>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Achievements ({achievements.earned.length} / {achievements.earned.length + achievements.locked.length})
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {achievements.earned.map((a) => (
              <Badge key={a.id} variant="warn" size="md">
                <span>{a.icon}</span> {a.label}
              </Badge>
            ))}
            {achievements.locked.slice(0, 3).map((a) => (
              <span key={a.id} className="chip bg-slate-50 text-slate-400 ring-1 ring-slate-200 opacity-70">
                <span className="grayscale">{a.icon}</span> {a.label}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
