# How to add a new game

A new game is one backend file + one frontend file, plus two lines of registration.

## 1. Backend module

Create `server/src/games/myGame.js`:

```js
import { mulberry32, defaultDailySeed, normText } from "./engine.js";

export const myGame = {
  id: "my-game",                     // stable, url-safe id
  name: "My Game",
  description: "Shown in the UI.",
  maxScore: 100,

  // YYYY-MM-DD → a string seed. `defaultDailySeed` is fine for most cases.
  dailySeed(date) {
    return defaultDailySeed(this.id, date);
  },

  // Build today's puzzle deterministically from the seed. Include both client-facing
  // data AND any secrets — the engine strips secrets via getPublicPuzzle before
  // sending to the browser.
  generatePuzzle(seed) {
    const rng = mulberry32(seed);
    return { prompt: "…", answer: "…" };
  },

  getPublicPuzzle(puzzle) {
    return { prompt: puzzle.prompt };
  },

  validateAnswer(input, puzzle) {
    return normText(input) === normText(puzzle.answer);
  },

  // NEW: Instant green/red feedback for the UI.
  // Called by /api/games/feedback without writing to the DB.
  // Can return anything game-specific — the frontend component decides how to render it.
  // Common fields: { correct: boolean, ... }
  getFeedback(input, puzzle) {
    return { correct: this.validateAnswer(input, puzzle) };
  },

  // Final scoring. Return { score, correct, accuracy, metadata }.
  // accuracy is 0..1 and optional — the engine derives it from score/maxScore if omitted.
  scoreAnswer(input, puzzle, ctx) {
    const correct = this.validateAnswer(input, puzzle);
    return {
      score: correct ? this.maxScore : 0,
      correct,
      accuracy: correct ? 1 : 0,
      metadata: { answer: puzzle.answer },
    };
  },
};
```

## 2. Register it

In `server/src/games/index.js`:

```js
import { myGame } from "./myGame.js";
registerGame(myGame);
```

## 3. Frontend player

Create `client/src/games/MyGamePlayer.jsx`:

```jsx
import { useState } from "react";
import { api } from "../lib/api.js";
import { sfx } from "../lib/sound.js";
import FeedbackFlash from "../components/FeedbackFlash.jsx";

export default function MyGamePlayer({ gameId, publicPuzzle, onSubmit, startedAt }) {
  const [value, setValue] = useState("");
  const [flash, setFlash] = useState({ key: 0, kind: null });
  const [busy, setBusy] = useState(false);

  async function guess() {
    if (!value.trim() || busy) return;
    setBusy(true);
    try {
      const { feedback } = await api.feedback(gameId, value);
      if (feedback.correct) {
        setFlash({ key: flash.key + 1, kind: "correct" });
        sfx.correct();
        await onSubmit(value, /* clientCtx */ {}, Date.now() - startedAt);
      } else {
        setFlash({ key: flash.key + 1, kind: "wrong" });
        sfx.wrong();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <FeedbackFlash trigger={flash.key} kind={flash.kind}>
      <div className="card">
        <p>{publicPuzzle.prompt}</p>
        <input className="input" value={value} onChange={(e) => setValue(e.target.value)} />
        <button className="btn-primary" onClick={guess}>Submit</button>
      </div>
    </FeedbackFlash>
  );
}
```

Register it in `client/src/games/index.js`:

```js
import MyGamePlayer from "./MyGamePlayer.jsx";
export const PLAYERS = {
  // …
  "my-game": MyGamePlayer,
};
export const GAME_ICONS = {
  // …
  "my-game": "🎯",
};
```

Restart `npm run dev`. The server exposes the new game via `/api/games` and `/api/games/daily` automatically; every page picks it up without further edits. The new game will also appear in the **Group Settings** game-selector grid — group creators can toggle it on for their group.

## Shape reference

**`scoreAnswer` result** (auto-normalized by the engine):

```ts
{
  score: number,       // 0..maxScore
  correct: boolean,
  accuracy?: number,   // 0..1; derived from score/maxScore if absent
  metadata?: object,   // anything you want shown in the post-game summary
}
```

**`getFeedback` result** is entirely game-specific, but it's conventional to include a top-level `correct: boolean`. Examples in this repo:

- `wordle` returns `{ tiles: string[][], correct }`
- `higher-lower` returns `{ rounds: [{correct, expected, actualStat}], correct }`
- `connections` returns `{ correct, theme?, color?, closeBy? }`
- `guess-year` returns `{ correct, diff, direction, actual }`
