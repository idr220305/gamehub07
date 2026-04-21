import { useEffect, useState } from "react";
import { getGameIcon } from "../games/index.js";
import { api } from "../lib/api.js";
import Card from "./ui/Card.jsx";
import Button from "./ui/Button.jsx";

export default function ShareResults({ date, groupName, submissions, games, user, groupId }) {
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState(null);

  // Pull current streak so we can include it in the share text.
  useEffect(() => {
    if (!user?.id || !groupId) return;
    api.stats(user.id, groupId).then((s) => setStreak(s.currentStreak)).catch(() => {});
  }, [user?.id, groupId]);

  const text = buildShareText({ date, groupName, submissions, games, streak });

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">Share your day</h3>
        <Button variant="secondary" onClick={onCopy}>
          {copied ? "✓ Copied" : "Copy"}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm font-mono ring-1 ring-slate-200">
        {text}
      </pre>
    </Card>
  );
}

function buildShareText({ date, groupName, submissions, games, streak }) {
  const lines = [`🎮 Daily Games Hub · ${date}`, `Group: ${groupName}`];
  if (streak != null && streak > 0) lines.push(`🔥 ${streak}-day streak`);
  lines.push("");
  let total = 0;
  for (const g of games) {
    const sub = submissions[g.id];
    if (!sub) {
      lines.push(`${getGameIcon(g.id)} ${g.name}: —`);
    } else {
      const squares = bar(sub.score / sub.maxScore);
      const doubled = sub.metadata?.doubled ? " ⭐2×" : "";
      lines.push(`${getGameIcon(g.id)} ${g.name}: ${squares} ${sub.score}${doubled}`);
      total += sub.score;
    }
  }
  lines.push("", `Total: ${total} pts`);
  return lines.join("\n");
}

function bar(pct) {
  const full = Math.round(Math.max(0, Math.min(1, pct)) * 5);
  return "🟩".repeat(full) + "⬜".repeat(5 - full);
}
