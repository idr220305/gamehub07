# 🚀 Deploying Daily Games Hub

This guide walks you through deploying the app to **Render** as a single Node service serving both the API and the built React client. You'll get a public URL like `https://daily-games-hub.onrender.com`.

**Time:** ~20 minutes
**Cost:** $0 on the free plan (data resets on restart) or **$7/month** for persistent storage.

---

## Before you start

You need:
- A **GitHub** account (free). We'll push the code there so Render can build from it.
- A **Render** account (free). Sign up at <https://render.com> — you can use GitHub to sign in.
- Git installed locally (`git --version` to check).

You do **not** need a credit card for the free plan. If you want persistent data you'll add one later.

---

## Step 1 — Push the code to GitHub

From inside the `daily-games-hub/` folder:

```bash
# Initialize a git repo if you haven't already
git init
git add .
git commit -m "Initial commit"
```

Now create an empty repository on GitHub:

1. Go to <https://github.com/new>
2. Name it `daily-games-hub`
3. Leave it Public or Private — either works
4. **Do not** tick "Add a README" or ".gitignore" (you already have those)
5. Click **Create repository**

GitHub shows you a block of commands under "…or push an existing repository from the command line". Copy and run those. It looks like:

```bash
git remote add origin https://github.com/YOUR-USERNAME/daily-games-hub.git
git branch -M main
git push -u origin main
```

Refresh the GitHub page — you should see all the files.

---

## Step 2 — Create the Render service

1. Go to <https://dashboard.render.com>
2. Click **New +** (top right) → **Blueprint**
3. Click **Connect a repository** and authorize Render to see your GitHub repos
4. Pick **daily-games-hub** from the list
5. Render reads the `render.yaml` file in your repo and shows you what it'll create:
   - A web service called `daily-games-hub`
   - A 1 GB persistent disk mounted at `/var/data`
6. Click **Apply**

### Free-tier alternative (no persistent data)

If you want to start on the free plan:

1. Open `render.yaml` in your editor
2. Change `plan: starter` to `plan: free`
3. Delete the entire `disk:` block at the bottom
4. Commit and push: `git add render.yaml && git commit -m "Free plan" && git push`
5. Re-apply the blueprint on Render

Caveat: every time your free service spins down (after ~15 min of no traffic) or redeploys, the SQLite file is wiped and re-seeded. Fine for showing friends. Not fine for real use.

---

## Step 3 — Watch it build

Render kicks off the first build immediately. Click on the service name to watch the log. You'll see:

1. `Cloning from https://github.com/…`
2. `Running build command 'npm run build'`
3. npm installing both workspaces (takes 1–2 min)
4. `prisma generate` + `prisma db push` + `pregen` (creates DB + 100 days of puzzles)
5. Vite building the client
6. `Running start command 'npm run start'`
7. `🎮 Daily Games Hub listening on http://localhost:10000`
8. `Your service is live 🎉`

First build takes **5–8 minutes**. After that, redeploys take 2–3 minutes.

Your URL appears at the top of the service page, something like:
```
https://daily-games-hub-abc1.onrender.com
```

Click it. You should see the sign-in screen.

---

## Step 4 — Smoke test

1. Open the URL in a browser
2. Sign in with any username (e.g. `alice`)
3. Create a group, pick some games, get an invite code
4. Open the URL in an incognito window, sign in as a different user (`bob`), join with the invite code
5. Both users can now see each other on the leaderboard

Share the URL (and invite code) with friends.

---

## Step 5 (optional) — Custom domain

1. Buy a domain from any registrar (Namecheap, Cloudflare, Porkbun…)
2. In Render: **Settings → Custom Domains → Add**
3. Render shows you a CNAME record to add at your registrar
4. Add it. Wait 2–5 min. TLS certificate is issued automatically by Let's Encrypt.

---

## Updating the app

Any time you want to ship changes:

```bash
git add .
git commit -m "What changed"
git push
```

Render auto-redeploys within a minute of the push. The database persists across deploys (on the paid plan).

---

## Troubleshooting

**Build fails with "prisma: not found"**
Your `build` script is running Prisma commands but Prisma isn't installed yet. The provided `npm run build` already handles this by running `npm install` first. If you've modified the script, make sure `npm install --prefix server` runs before any prisma command.

**"DATABASE_URL not found" at runtime**
Render should set this from `render.yaml`. Check **Settings → Environment** on Render and confirm `DATABASE_URL` is `file:/var/data/dgh.db`. On free plan without a disk, set it to `file:./server/prisma/dev.db` instead.

**Data disappears after a redeploy**
You're on the free plan, or your `DATABASE_URL` points to a non-persistent path. On the Starter plan with the disk mounted at `/var/data`, the DB must live at `file:/var/data/…`.

**Sign-in works but API requests 404**
Make sure the built client is actually being served. The build log should show a "Serving client from …/client/dist" line at startup. If not, the build didn't produce `client/dist/` — check the `npm run build --prefix client` step in the build log.

**I want to reset all data**
Either redeploy on the free plan, or go to **Settings → Disks → Shell** on the paid plan and run `rm /var/data/dgh.db`, then restart the service.

**I want to run it somewhere else**
Any Node host works. The app is a single service: `npm run build` + `npm run start`, listening on `process.env.PORT`, with `DATABASE_URL` pointing to a writable SQLite path. Fly.io, Railway, a VPS with Caddy in front — all fine.

---

## How it works under the hood

- `client/` builds into `client/dist/` — static HTML, JS, CSS
- `server/src/index.js` serves the API under `/api/*` and falls back to `client/dist/index.html` for everything else (so React Router handles client-side routing including deep links)
- SQLite file lives wherever `DATABASE_URL` points. On Render's Starter plan, the persistent disk at `/var/data` survives restarts and redeploys.
- `npm run build` installs both workspaces, generates the Prisma client, builds the React app, runs migrations, and pre-generates 100 days of puzzles
- `npm run start` just starts Express
