# 🎮 Daily Games Hub

A private hub where groups of friends compete in one shared set of daily games. Wordle-style mechanic (one shot per day, same puzzle for everyone, locked after submission), instant green/red feedback, streak + bonus system, and a pluggable game engine.

## Quick start

Requires Node 18+.

```bash
npm install   # installs server + client, sets up SQLite, seeds demo data
npm run dev   # API on :4000, Vite on :5173
```

Open <http://localhost:5173>.

Demo accounts (no passwords — just type a username): `alice`, `bob`, `carol`, `dave`.
Demo group invite code: `DEMO01`.

## What's in here

**12 games:** Wordle, Connections, Emoji Phrase, Higher or Lower, Blur Reveal, Flag Fragments, Guess the Year, Fake Fact, Songless, Sound Guess, Set, Precision Draw.

**Premium UI:** shared design system (`Card`, `Button`, `Badge`, `ProgressBar`, `Avatar`, `Confetti`), refined typography, soft shadows + hover lift, semantic color tokens (primary / success / danger / warn / ink), 200ms transitions throughout.

**Group hub:**
- Big primary CTA — "Play today's games" — front and center
- Daily progress bar (e.g. `2 / 5 played`)
- Activity feed — "Bob scored 85 in Emoji Phrase · 4m ago"
- Player list with avatars, streak 🔥, and 👑 crown for the all-time leader
- Stat tiles: streak, current rank with **rank delta arrow** (↑ +2 since yesterday), all-time total

**Higher or Lower (fixed UX):**
- Previous country shows its actual stat ("France: 65M")
- Next country shows `—` until you commit
- After picking, the value count-ups to its real number with green/red ring
- Cross-fade transition between rounds
- Big animated 🔥 streak indicator at top
- Round dots show your full history at a glance

**Per-game polish:**
- Difficulty badges (`easy` / `medium` / `hard`) on every game card
- ⭐ **Daily double** — one game per day (deterministic per date) gives 2× points; surfaced in tabs, dashboard, leaderboard
- Timer shown in the post-game summary (`⏱ 24s`)
- Confetti burst on perfect runs and on completing all daily games
- Smooth scale-in transition between games

**Personal stats page** (new): `/group/:groupId/stats`
- Games played, average score, accuracy %, best streak
- Per-game breakdown with accuracy bar

**Top bar streak:** your current streak follows you across pages 🔥

**Share output:**
```
🎮 Daily Games Hub · 2026-04-17
Group: Demo Crew
🔥 5-day streak

🟩 Wordle: 🟩🟩🟩🟩⬜ 90
🧩 Connections: 🟩🟩⬜⬜⬜ 50
🌫️ Blur Reveal: 🟩🟩🟩🟩🟩 100 ⭐2×

Total: 240 pts
```

## Scoring

Every `scoreAnswer` returns `{ score, correct, accuracy, metadata }`. The engine normalizes it and the server stores `{ score, maxScore, timeTaken, metadata }`.

**Bonuses** added by the leaderboard:
- All games today: +20
- High accuracy ≥90%: +15
- Perfect run (all games at max score): +50
- Daily double: 2× points on the chosen game (multiplier applied at storage time)

Weekly and all-time totals sum each day's total-with-bonuses.

## Project layout

```
daily-games-hub/
├─ package.json
├─ server/
│  ├─ prisma/schema.prisma
│  └─ src/
│     ├─ index.js
│     ├─ db.js / dates.js / scoring.js / dailyFeatures.js / seed.js
│     ├─ routes/            users · groups · games · leaderboard
│     └─ games/
│        ├─ engine.js       registry + seeded RNG + DIFFICULTY + normalizeScore
│        ├─ index.js        registers every game
│        ├─ README.md       how to add a new game
│        └─ *.js            one file per game
└─ client/
   ├─ vite.config.js / tailwind.config.js (semantic palette + animations)
   └─ src/
      ├─ main.jsx / App.jsx
      ├─ index.css          design tokens + .btn / .card / .container
      ├─ lib/               api · session · sound · notes
      ├─ components/
      │  ├─ NavBar · FeedbackFlash · PostGameSummary · ShareResults
      │  └─ ui/             Card · Button · Badge · ProgressBar · Avatar · Confetti
      ├─ pages/             Home · GroupDashboard · DailyGames · Leaderboard · PlayerStats
      └─ games/             one *Player.jsx per game + index.js (PLAYERS map + GAME_ICONS)
```

## API

| Method | Path                              | Description                                            |
|--------|-----------------------------------|--------------------------------------------------------|
| POST   | `/api/users`                      | Create or fetch user by username                       |
| POST   | `/api/groups`                     | Create a new group                                     |
| POST   | `/api/groups/join`                | Join via invite code                                   |
| GET    | `/api/groups/mine/:userId`        | List groups for a user                                 |
| GET    | `/api/groups/:id`                 | Group with members                                     |
| GET    | `/api/games`                      | All registered games (incl. difficulty)                |
| GET    | `/api/games/daily?userId&groupId` | Today's games + dailyDouble + per-game submission state|
| POST   | `/api/games/feedback`             | Tentative feedback (no DB write)                       |
| POST   | `/api/games/submit`               | Commit final answer; returns rank + group %            |
| GET    | `/api/games/stats/:userId`        | Personal stats (filterable by `?groupId=`)             |
| GET    | `/api/games/activity/:groupId`    | Recent submissions for the activity feed               |
| GET    | `/api/leaderboard/:groupId`       | Daily/weekly/all-time + streaks + bonuses + rankDelta  |

## Adding a new game

See `server/src/games/README.md` — one backend file + one frontend file + two registration lines.

## Scripts

- `npm install` — installs both packages, runs DB setup + seed
- `npm run dev` — API + web dev server
- `npm run seed` — re-seed
- `npm run reset` — nuke the SQLite DB and reseed
- `npm run build` — production build of the client

## Tech

React 18 + Vite + React Router + TailwindCSS · Node + Express (ESM) · SQLite via Prisma · No external APIs.
