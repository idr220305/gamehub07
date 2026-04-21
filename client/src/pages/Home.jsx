import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useSession, setSession } from "../lib/session.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Badge from "../components/ui/Badge.jsx";
import GameSelector, { MIN_GAMES } from "../components/GameSelector.jsx";
import { toast } from "../components/ui/Toast.jsx";

export default function Home() {
  const navigate = useNavigate();
  const user = useSession();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [createStep, setCreateStep] = useState("name"); // name | games
  const [selection, setSelection] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [createdGroup, setCreatedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [busy, setBusy] = useState(null); // null | "signin" | "create" | "join"
  const [err, setErr] = useState(null);
  const usernameRef = useRef(null);

  useEffect(() => {
    if (!user) {
      // Autofocus username on first load.
      requestAnimationFrame(() => usernameRef.current?.focus());
      return;
    }
    api.myGroups(user.id).then(setGroups).catch(() => {});
  }, [user]);

  async function signIn(e) {
    e.preventDefault();
    setErr(null);
    if (!username.trim()) return;
    setBusy("signin");
    try {
      const u = await api.createUser(username.trim(), displayName.trim() || username.trim());
      setSession(u);
      toast(`Welcome, ${u.displayName}!`, { kind: "success" });
    } catch (e) {
      setErr(e.message || "Couldn't sign in. Try a different username.");
    } finally {
      setBusy(null);
    }
  }

  async function createGroup(e) {
    e.preventDefault();
    setErr(null);
    if (!groupName.trim() || selection.length < MIN_GAMES) return;
    setBusy("create");
    try {
      const g = await api.createGroup(groupName.trim(), user.id, selection);
      setCreatedGroup(g);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function joinGroup(e) {
    e.preventDefault();
    setErr(null);
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    setBusy("join");
    try {
      const g = await api.joinGroup(code, user.id);
      toast(`Joined "${g.name}"`, { kind: "success" });
      navigate(`/group/${g.id}`);
    } catch (e) {
      if (e.status === 404) setErr("That invite code doesn't exist. Double-check it with your group.");
      else setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function copyCode(code) {
    try { await navigator.clipboard.writeText(code); toast("Code copied"); } catch {}
  }

  // ---------- NOT SIGNED IN ----------
  if (!user) {
    return (
      <div className="container-narrow section animate-fade-in">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            ✨ 12 daily games · play with friends
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Play together,<br />every day.</h1>
          <p className="mt-3 text-slate-600">
            One shared set of daily games. Friends compete asynchronously on a group leaderboard.
          </p>
        </div>
        <Card className="mx-auto mt-8 max-w-md" padding="lg">
          <form className="space-y-3" onSubmit={signIn}>
            <h2 className="text-lg font-bold">Sign in</h2>
            <input
              ref={usernameRef}
              className="input"
              placeholder="username (a-z, 0-9, _)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={busy === "signin"}
            />
            <input
              className="input"
              placeholder="display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={busy === "signin"}
            />
            {err && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{err}</p>}
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              disabled={busy === "signin" || !username.trim()}
            >
              {busy === "signin" ? "Signing in…" : "Continue →"}
            </Button>
            <p className="text-center text-xs text-slate-500">
              No password — this is a demo. Try <code className="font-mono">alice</code>.
            </p>
          </form>
        </Card>
      </div>
    );
  }

  // ---------- SIGNED IN ----------
  return (
    <div className="container-narrow section stack-y animate-fade-in">
      <div className="flex items-center gap-3">
        <Avatar name={user.displayName} size="xl" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, {user.displayName}.</h1>
          <p className="text-slate-500">Signed in as <span className="font-mono">@{user.username}</span></p>
        </div>
      </div>

      {groups.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-bold">Your groups</h2>
          <ul className="divide-y divide-slate-100">
            {groups.map((g) => (
              <li key={g.id}>
                <button
                  className="-mx-2 flex w-full items-center justify-between rounded-lg px-2 py-3 text-left transition hover:bg-slate-50"
                  onClick={() => navigate(`/group/${g.id}`)}
                >
                  <div>
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs text-slate-500">
                      Code <span className="font-mono">{g.inviteCode}</span> · {g.memberCount} members
                    </div>
                  </div>
                  <span className="text-slate-400">→</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Create */}
        <Card className={createStep === "games" && !createdGroup ? "sm:col-span-2" : ""}>
          {createdGroup ? (
            <div className="space-y-3 animate-scale-in">
              <Badge variant="success" size="md">Group created!</Badge>
              <h2 className="text-xl font-bold">{createdGroup.name}</h2>
              <p className="text-sm text-slate-600">Share this invite code with friends:</p>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3 text-center text-2xl font-black tracking-[0.3em] text-ink ring-1 ring-slate-200">
                  {createdGroup.inviteCode}
                </div>
                <Button variant="secondary" onClick={() => copyCode(createdGroup.inviteCode)}>
                  Copy
                </Button>
              </div>
              <Button variant="accent" className="w-full" onClick={() => navigate(`/group/${createdGroup.id}`)}>
                Open group →
              </Button>
            </div>
          ) : createStep === "name" ? (
            <form
              className="space-y-3"
              onSubmit={(e) => { e.preventDefault(); if (groupName.trim()) setCreateStep("games"); }}
            >
              <h2 className="text-lg font-bold">Create a group</h2>
              <input
                className="input"
                placeholder="Group name (e.g. Bagel Brunch)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
              <Button variant="accent" className="w-full" disabled={!groupName.trim()}>
                Pick games →
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={createGroup}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Pick games for "{groupName}"</h2>
                <button type="button" className="btn-ghost text-xs" onClick={() => setCreateStep("name")}>
                  ← Back
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Your group will play these games each day. You can change them later.
              </p>
              <GameSelector value={selection} onChange={setSelection} />
              <Button
                variant="accent"
                className="w-full"
                disabled={busy === "create" || selection.length < MIN_GAMES}
              >
                {busy === "create" ? "Creating…" : `Create group with ${selection.length} games`}
              </Button>
            </form>
          )}
        </Card>

        {/* Join */}
        {!(createStep === "games" && !createdGroup) && (
        <Card>
          <form className="space-y-3" onSubmit={joinGroup}>
            <h2 className="text-lg font-bold">Join a group</h2>
            <input
              className="input font-mono uppercase tracking-[0.3em] text-center"
              placeholder="ABC123"
              maxLength={6}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              disabled={busy === "join"}
            />
            <Button variant="secondary" className="w-full" disabled={busy === "join" || !inviteCode.trim()}>
              {busy === "join" ? "Joining…" : "Join"}
            </Button>
            <p className="text-xs text-slate-500">
              Try <span className="font-mono">DEMO01</span> for the seeded demo group.
            </p>
          </form>
        </Card>
        )}
      </div>

      {err && <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{err}</p>}
    </div>
  );
}
