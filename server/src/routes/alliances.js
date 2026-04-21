import express from "express";
import { prisma } from "../db.js";

const router = express.Router();

const COLORS = ["rose", "emerald", "sky", "amber", "violet", "pink", "teal", "indigo"];

async function ensureGroupAlliancesEnabled(groupId) {
  const g = await prisma.group.findUnique({ where: { id: groupId } });
  if (!g) throw { status: 404, message: "group not found" };
  if (!g.alliancesEnabled) throw { status: 400, message: "alliances not enabled for this group" };
  return g;
}

async function currentAllianceFor(userId, groupId) {
  const row = await prisma.allianceMember.findFirst({
    where: { userId, alliance: { groupId } },
    include: { alliance: true },
  });
  return row || null;
}

// List alliances in a group, with members and their daily totals for the leaderboard.
router.get("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: "group not found" });
    const alliances = await prisma.alliance.findMany({
      where: { groupId },
      include: { members: { include: { user: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({
      alliancesEnabled: group.alliancesEnabled,
      alliances: alliances.map((a) => ({
        id: a.id,
        name: a.name,
        color: a.color,
        memberIds: a.members.map((m) => m.userId),
        members: a.members.map((m) => ({
          userId: m.userId, username: m.user.username, displayName: m.user.displayName,
        })),
      })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load alliances" });
  }
});

// Create an alliance. User must be a member of the group, and not already in another alliance in this group.
router.post("/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, name, color } = req.body || {};
    if (!userId || !name) return res.status(400).json({ error: "userId and name required" });
    const group = await ensureGroupAlliancesEnabled(groupId);

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) return res.status(403).json({ error: "Not a member of this group" });

    const current = await currentAllianceFor(userId, groupId);
    if (current) return res.status(400).json({ error: "Already in an alliance — leave first" });

    const existing = await prisma.alliance.findUnique({
      where: { groupId_name: { groupId, name: name.trim().slice(0, 40) } },
    }).catch(() => null);
    if (existing) return res.status(409).json({ error: "Name already taken" });

    const alliance = await prisma.alliance.create({
      data: {
        groupId,
        name: name.trim().slice(0, 40),
        color: COLORS.includes(color) ? color : COLORS[Math.floor(Math.random() * COLORS.length)],
        members: { create: { userId } },
      },
      include: { members: true },
    });
    res.json(alliance);
  } catch (e) {
    if (e?.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: "Failed to create alliance" });
  }
});

// Join an existing alliance.
router.post("/:groupId/join/:allianceId", async (req, res) => {
  try {
    const { groupId, allianceId } = req.params;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });

    const group = await ensureGroupAlliancesEnabled(groupId);
    const alliance = await prisma.alliance.findUnique({ where: { id: allianceId } });
    if (!alliance || alliance.groupId !== groupId)
      return res.status(404).json({ error: "alliance not found" });

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) return res.status(403).json({ error: "Not a member of this group" });

    const current = await currentAllianceFor(userId, groupId);
    if (current) {
      if (current.allianceId === allianceId) return res.json({ ok: true });
      return res.status(400).json({ error: "Already in an alliance — leave first" });
    }

    await prisma.allianceMember.create({ data: { allianceId, userId } });
    res.json({ ok: true });
  } catch (e) {
    if (e?.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: "Failed to join alliance" });
  }
});

// Leave current alliance in a group.
router.post("/:groupId/leave", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });

    const current = await currentAllianceFor(userId, groupId);
    if (!current) return res.json({ ok: true });
    await prisma.allianceMember.delete({ where: { id: current.id } });
    // Clean up empty alliance.
    const remaining = await prisma.allianceMember.count({ where: { allianceId: current.allianceId } });
    if (remaining === 0) {
      await prisma.alliance.delete({ where: { id: current.allianceId } }).catch(() => {});
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to leave alliance" });
  }
});

export default router;
