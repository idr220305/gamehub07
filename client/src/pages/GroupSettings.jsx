import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import GameSelector, { MIN_GAMES } from "../components/GameSelector.jsx";
import { toast } from "../components/ui/Toast.jsx";

export default function GroupSettings() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSession();
  const [group, setGroup] = useState(null);
  const [selection, setSelection] = useState([]);
  const [dailyMode, setDailyMode] = useState("fixed");
  const [dailyPoolSize, setDailyPoolSize] = useState(5);
  const [alliancesEnabled, setAlliancesEnabled] = useState(false);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api.getGroup(groupId).then((g) => {
      setGroup(g);
      setSelection(g.selectedGames || []);
      setDailyMode(g.dailyMode || "fixed");
      setDailyPoolSize(g.dailyPoolSize || 5);
      setAlliancesEnabled(!!g.alliancesEnabled);
    }).catch((e) => setErr(e.message));
  }, [groupId]);

  if (err) return <div className="container-narrow section text-danger-600">{err}</div>;
  if (!group) return <div className="container-narrow section"><div className="skel h-64" /></div>;

  const isCreator = !group.createdByUserId || group.createdByUserId === user?.id;

  async function saveGames() {
    setBusy("games");
    setErr(null);
    try {
      await api.updateGroupGames(groupId, user.id, selection);
      toast("Games updated", { kind: "success" });
    } catch (e) { setErr(e.message); } finally { setBusy(null); }
  }

  async function saveSettings() {
    setBusy("settings");
    setErr(null);
    try {
      await api.updateGroupSettings(groupId, user.id, {
        dailyMode,
        dailyPoolSize,
        alliancesEnabled,
      });
      toast("Settings saved", { kind: "success" });
    } catch (e) { setErr(e.message); } finally { setBusy(null); }
  }

  async function doLeave() {
    setConfirmLeave(false);
    setBusy("leave");
    try {
      await api.leaveGroup(groupId, user.id);
      toast("You left the group", { kind: "success" });
      navigate("/", { replace: true });
    } catch (e) { setErr(e.message); setBusy(null); }
  }

  async function doDelete() {
    setConfirmDelete(false);
    setBusy("delete");
    try {
      await api.deleteGroup(groupId, user.id);
      toast("Group deleted", { kind: "success" });
      navigate("/", { replace: true });
    } catch (e) { setErr(e.message); setBusy(null); }
  }

  return (
    <div className="container-narrow section stack-y animate-fade-in">
      <div>
        <Link to={`/group/${group.id}`} className="text-sm text-slate-500 hover:text-slate-900">
          ← {group.name}
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Group settings</h1>
      </div>

      {/* Game selection */}
      <Card padding="lg">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Games</h2>
            <p className="text-sm text-slate-500">Which games your group plays.</p>
          </div>
        </div>
        {!isCreator && (
          <div className="mb-4 rounded-xl bg-warn-50 px-4 py-3 text-sm text-warn-700">
            Only the group creator can change the games.
          </div>
        )}
        <fieldset disabled={!isCreator || busy === "games"}>
          <GameSelector value={selection} onChange={setSelection} />
        </fieldset>
        {isCreator && (
          <div className="mt-4 flex justify-end">
            <Button variant="accent" onClick={saveGames} disabled={busy === "games" || selection.length < MIN_GAMES}>
              {busy === "games" ? "Saving…" : "Save games"}
            </Button>
          </div>
        )}
      </Card>

      {/* Daily mode + Alliances */}
      <Card padding="lg">
        <h2 className="text-lg font-bold">Daily mode</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use all selected games every day, or let the server shuffle a subset each day.
        </p>

        <fieldset disabled={!isCreator || busy === "settings"} className="mt-3 space-y-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition
            ${dailyMode === "fixed" ? "bg-primary-50 ring-primary-300" : "bg-white ring-slate-200 hover:bg-slate-50"}`}>
            <input type="radio" name="mode" value="fixed" checked={dailyMode === "fixed"} onChange={() => setDailyMode("fixed")} className="mt-1" />
            <div>
              <div className="font-semibold">Fixed</div>
              <div className="text-xs text-slate-500">Every day includes all selected games.</div>
            </div>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition
            ${dailyMode === "random" ? "bg-primary-50 ring-primary-300" : "bg-white ring-slate-200 hover:bg-slate-50"}`}>
            <input type="radio" name="mode" value="random" checked={dailyMode === "random"} onChange={() => setDailyMode("random")} className="mt-1" />
            <div className="flex-1">
              <div className="font-semibold">Random daily subset</div>
              <div className="text-xs text-slate-500">
                Each day picks a different subset from your games (same subset for all members).
              </div>
              {dailyMode === "random" && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-600">Games per day:</span>
                  <input
                    type="number" min="1" max="20"
                    value={dailyPoolSize}
                    onChange={(e) => setDailyPoolSize(Number(e.target.value) || 1)}
                    className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
          </label>
        </fieldset>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="text-base font-bold flex items-center gap-2">
            🤝 Alliances
            <Badge variant="outline" size="sm">Optional</Badge>
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Let members form sub-teams that compete against each other inside the group.
          </p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              disabled={!isCreator || busy === "settings"}
              checked={alliancesEnabled}
              onChange={(e) => setAlliancesEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-semibold">Enable alliances in this group</span>
          </label>
        </div>

        {isCreator && (
          <div className="mt-4 flex justify-end">
            <Button variant="accent" onClick={saveSettings} disabled={busy === "settings"}>
              {busy === "settings" ? "Saving…" : "Save settings"}
            </Button>
          </div>
        )}
      </Card>

      {/* Danger zone */}
      <Card padding="lg" className="ring-danger-100">
        <h2 className="text-lg font-bold text-danger-600">Danger zone</h2>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
            <div>
              <div className="font-semibold">Leave this group</div>
              <div className="text-xs text-slate-500">You can rejoin later with the invite code.</div>
            </div>
            <Button variant="secondary" onClick={() => setConfirmLeave(true)} disabled={busy === "leave"}>
              Leave
            </Button>
          </div>
          {isCreator && (
            <div className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-danger-200">
              <div>
                <div className="font-semibold text-danger-600">Delete group</div>
                <div className="text-xs text-slate-500">Permanently removes the group, members, submissions, and alliances.</div>
              </div>
              <Button variant="danger" onClick={() => setConfirmDelete(true)} disabled={busy === "delete"}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      {err && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{err}</p>}

      <ConfirmDialog
        open={confirmLeave}
        title="Leave this group?"
        body={<>You'll lose access to the group's leaderboard. You can rejoin later with the invite code <b>{group.inviteCode}</b>.</>}
        confirmLabel="Leave" confirmVariant="danger"
        onConfirm={doLeave} onCancel={() => setConfirmLeave(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this group?"
        body={<>This <b>cannot be undone</b>. All members, submissions, and alliances will be removed.</>}
        confirmLabel="Delete forever" confirmVariant="danger"
        onConfirm={doDelete} onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
