import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useSession } from "../lib/session.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { toast } from "../components/ui/Toast.jsx";

const COLORS = [
  { id: "rose", bg: "bg-rose-500", soft: "bg-rose-50", ring: "ring-rose-200" },
  { id: "emerald", bg: "bg-emerald-500", soft: "bg-emerald-50", ring: "ring-emerald-200" },
  { id: "sky", bg: "bg-sky-500", soft: "bg-sky-50", ring: "ring-sky-200" },
  { id: "amber", bg: "bg-amber-500", soft: "bg-amber-50", ring: "ring-amber-200" },
  { id: "violet", bg: "bg-violet-500", soft: "bg-violet-50", ring: "ring-violet-200" },
  { id: "pink", bg: "bg-pink-500", soft: "bg-pink-50", ring: "ring-pink-200" },
  { id: "teal", bg: "bg-teal-500", soft: "bg-teal-50", ring: "ring-teal-200" },
  { id: "indigo", bg: "bg-indigo-500", soft: "bg-indigo-50", ring: "ring-indigo-200" },
];

function colorFor(id) {
  return COLORS.find((c) => c.id === id) || COLORS[0];
}

export default function Alliances() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSession();
  const [group, setGroup] = useState(null);
  const [data, setData] = useState(null);
  const [lb, setLb] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("rose");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function refresh() {
    const [g, a, l] = await Promise.all([
      api.getGroup(groupId),
      api.listAlliances(groupId),
      api.leaderboard(groupId),
    ]);
    setGroup(g); setData(a); setLb(l);
  }

  useEffect(() => { refresh().catch((e) => setErr(e.message)); }, [groupId]);

  if (err) return <div className="container-narrow section text-danger-600">{err}</div>;
  if (!group || !data || !lb) return <div className="container-narrow section"><div className="skel h-64" /></div>;

  if (!data.alliancesEnabled) {
    return (
      <div className="container-narrow section stack-y animate-fade-in">
        <h1 className="text-2xl font-extrabold">Alliances are off</h1>
        <p className="text-slate-500">
          The group creator hasn't enabled alliances for {group.name}.
        </p>
        <Link to={`/group/${group.id}`}><Button variant="secondary">Back to group</Button></Link>
      </div>
    );
  }

  const myAlliance = data.alliances.find((a) => a.memberIds.includes(user.id));

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.createAlliance(groupId, user.id, name.trim(), color);
      toast(`Alliance "${name}" created`, { kind: "success" });
      setShowCreate(false); setName("");
      await refresh();
    } catch (e) { toast(e.message, { kind: "error" }); }
    finally { setBusy(false); }
  }

  async function join(allianceId) {
    setBusy(true);
    try {
      await api.joinAlliance(groupId, allianceId, user.id);
      toast("Joined alliance", { kind: "success" });
      await refresh();
    } catch (e) { toast(e.message, { kind: "error" }); }
    finally { setBusy(false); }
  }

  async function leave() {
    setBusy(true);
    try {
      await api.leaveAlliance(groupId, user.id);
      toast("Left alliance", { kind: "success" });
      await refresh();
    } catch (e) { toast(e.message, { kind: "error" }); }
    finally { setBusy(false); }
  }

  return (
    <div className="container-narrow section stack-y animate-fade-in">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Link to={`/group/${group.id}`} className="text-sm text-slate-500 hover:text-slate-900">← {group.name}</Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Alliances</h1>
          <p className="text-sm text-slate-500">Sub-teams that compete inside the group.</p>
        </div>
        {!myAlliance ? (
          <Button variant="accent" onClick={() => setShowCreate(!showCreate)}>+ New alliance</Button>
        ) : (
          <Button variant="secondary" onClick={leave} disabled={busy}>Leave alliance</Button>
        )}
      </div>

      {/* Alliance leaderboard */}
      {lb.alliances.length > 0 && (
        <Card padding="md">
          <h2 className="mb-3 text-lg font-bold">Leaderboard (weekly)</h2>
          <ul className="space-y-2">
            {lb.alliances.map((a, i) => {
              const c = colorFor(a.color);
              const mine = myAlliance?.id === a.id;
              return (
                <li
                  key={a.id}
                  className={`flex items-center justify-between rounded-xl p-3 ring-1 ${c.soft} ${c.ring} ${mine ? "shadow-soft" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${c.bg} text-xl`}>
                      {i === 0 ? "👑" : "⚔️"}
                    </div>
                    <div>
                      <div className="font-bold">
                        {a.name}
                        {mine && <span className="ml-2 text-xs text-slate-500">(yours)</span>}
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.memberCount} member{a.memberCount === 1 ? "" : "s"} · avg {a.weeklyAvg} pts
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black tabular-nums">{a.weekly}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">weekly</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Create form */}
      {showCreate && !myAlliance && (
        <Card padding="lg" className="animate-scale-in">
          <h3 className="mb-3 text-lg font-bold">Create an alliance</h3>
          <div className="space-y-3">
            <input
              className="input" placeholder="Alliance name"
              value={name} onChange={(e) => setName(e.target.value)}
              maxLength={40} autoFocus
            />
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Color</div>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.id} type="button"
                    onClick={() => setColor(c.id)}
                    className={`h-8 w-8 rounded-full ${c.bg} ring-2 transition-all ${
                      color === c.id ? "ring-ink scale-110" : "ring-transparent"
                    }`}
                    aria-label={c.id}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="accent" onClick={create} disabled={busy || !name.trim()}>Create</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Alliance cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.alliances.length === 0 ? (
          <Card className="sm:col-span-2">
            <p className="text-sm text-slate-500">No alliances yet — be the first to start one.</p>
          </Card>
        ) : data.alliances.map((a) => {
          const c = colorFor(a.color);
          const mine = myAlliance?.id === a.id;
          return (
            <Card key={a.id} padding="md" className={`${c.soft} ring-1 ${c.ring}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${c.bg} text-lg text-white`}>⚔️</div>
                  <div>
                    <div className="font-bold text-lg">{a.name}</div>
                    <div className="text-xs text-slate-500">{a.members.length} member{a.members.length === 1 ? "" : "s"}</div>
                  </div>
                </div>
                {mine ? (
                  <Badge variant="primary" size="sm">You're in</Badge>
                ) : !myAlliance ? (
                  <Button variant="secondary" size="sm" onClick={() => join(a.id)} disabled={busy}>Join</Button>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-1.5 rounded-full bg-white/80 py-0.5 pl-0.5 pr-2 ring-1 ring-slate-200">
                    <Avatar name={m.displayName} size="sm" />
                    <span className="text-xs font-semibold">{m.displayName}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
