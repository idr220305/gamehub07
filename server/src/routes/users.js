import express from "express";
import { prisma } from "../db.js";

const router = express.Router();

// Create user (or return existing by username).
router.post("/", async (req, res) => {
  try {
    const { username, displayName } = req.body || {};
    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "username required" });
    }
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (clean.length < 2) {
      return res.status(400).json({ error: "username must be at least 2 characters (a-z, 0-9, _)" });
    }
    const existing = await prisma.user.findUnique({ where: { username: clean } });
    if (existing) return res.json(existing);

    const user = await prisma.user.create({
      data: {
        username: clean,
        displayName: (displayName || username).trim().slice(0, 40),
      },
    });
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Get user by id.
router.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "not found" });
  res.json(user);
});

export default router;
