import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import "./games/index.js"; // registers all games
import usersRouter from "./routes/users.js";
import groupsRouter from "./routes/groups.js";
import gamesRouter from "./routes/games.js";
import leaderboardRouter from "./routes/leaderboard.js";
import alliancesRouter from "./routes/alliances.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/users", usersRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/games", gamesRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/alliances", alliancesRouter);

// In production: serve the built client from ../client/dist and fall back to
// index.html for unknown routes (so React Router works with deep links).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
  console.log(`📦 Serving client from ${clientDist}`);
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🎮 Daily Games Hub listening on http://localhost:${PORT}`);
});
