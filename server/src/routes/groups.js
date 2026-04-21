import express from "express";
import { customAlphabet } from "nanoid";
import { prisma } from "../db.js";
import { validateSelection } from "../groupGames.js";

const router = express.Router();
const codeGen = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

function serializeGroup(g) {
  return {
    ...g,
    selectedGames: g.selectedGames ? JSON.parse(g.selectedGames) : null,
  };
}

router.post("/", async (req, res) => {
  try {
    const { name, userId, selectedGames } = req.body || {};
    if (!name || !userId) return res.status(400).json({ error: "name and userId required" });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "user not found" });

    let selectedJson = null;
    if (selectedGames !== undefined && selectedGames !== null) {
      try { selectedJson = JSON.stringify(validateSelection(selectedGames)); }
      catch (e) { return res.status(400).json({ error: e.message }); }
    }

    let inviteCode;
    for (let i = 0; i < 5; i++) {
      const candidate = codeGen();
      const exists = await prisma.group.findUnique({ where: { inviteCode: candidate } });
      if (!exists) { inviteCode = candidate; break; }
    }
    if (!inviteCode) return res.status(500).json({ error: "could not allocate invite code" });

    const group = await prisma.group.create({
      data: {
        name: String(name).trim().slice(0, 60),
        inviteCode,
        createdByUserId: userId,
        selectedGames: selectedJson,
        members: { create: { userId } },
      },
      include: { members: { include: { user: true } } },
    });
    res.json(serializeGroup(group));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Edit selected games — only the creator can change.
router.patch("/:id/games", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, selectedGames } = req.body || {};
    const group = await prisma.group.findUnique({ where: { id } });
    if (!group) return res.status(404).json({ error: "group not found" });
    if (group.createdByUserId && group.createdByUserId !== userId) {
      return res.status(403).json({ error: "Only the group creator can change games." });
    }
    let cleaned;
    try { cleaned = validateSelection(selectedGames); }
    catch (e) { return res.status(400).json({ error: e.message }); }

    const updated = await prisma.group.update({
      where: { id },
      data: { selectedGames: JSON.stringify(cleaned) },
    });
    res.json(serializeGroup(updated));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update group games" });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { inviteCode, userId } = req.body || {};
    if (!inviteCode || !userId) return res.status(400).json({ error: "inviteCode and userId required" });
    const group = await prisma.group.findUnique({
      where: { inviteCode: String(inviteCode).toUpperCase().trim() },
    });
    if (!group) return res.status(404).json({ error: "group not found" });

    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId, groupId: group.id } },
      update: {},
      create: { userId, groupId: group.id },
    });
    const full = await prisma.group.findUnique({
      where: { id: group.id },
      include: { members: { include: { user: true } } },
    });
    res.json(serializeGroup(full));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to join group" });
  }
});

router.get("/mine/:userId", async (req, res) => {
  const memberships = await prisma.groupMember.findMany({
    where: { userId: req.params.userId },
    include: { group: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });
  res.json(memberships.map((m) => ({
    ...serializeGroup(m.group),
    memberCount: m.group._count.members,
  })));
});

router.get("/:id", async (req, res) => {
  const group = await prisma.group.findUnique({
    where: { id: req.params.id },
    include: { members: { include: { user: true } } },
  });
  if (!group) return res.status(404).json({ error: "not found" });
  res.json(serializeGroup(group));
});

// Update settings (creator only). Accepts: alliancesEnabled?, dailyMode?, dailyPoolSize?
router.patch("/:id/settings", async (req, res) => {
  try {
    const { userId, alliancesEnabled, dailyMode, dailyPoolSize } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const group = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!group) return res.status(404).json({ error: "group not found" });
    if (group.createdByUserId && group.createdByUserId !== userId) {
      return res.status(403).json({ error: "Only the group creator can change settings" });
    }
    const data = {};
    if (typeof alliancesEnabled === "boolean") data.alliancesEnabled = alliancesEnabled;
    if (dailyMode === "fixed" || dailyMode === "random") data.dailyMode = dailyMode;
    if (dailyPoolSize != null) data.dailyPoolSize = Math.max(1, Math.min(20, Number(dailyPoolSize) | 0));
    const updated = await prisma.group.update({ where: { id: group.id }, data });
    res.json(withSelected(updated));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Leave a group. If the user is the creator AND other members remain, transfer creator.
// If creator AND last member, delete the group.
router.post("/:id/leave", async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: "userId required" });
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });
    if (!group) return res.status(404).json({ error: "group not found" });
    const mem = group.members.find((m) => m.userId === userId);
    if (!mem) return res.status(400).json({ error: "Not in group" });

    await prisma.groupMember.delete({ where: { id: mem.id } });

    // Also remove from any alliance in this group.
    await prisma.allianceMember.deleteMany({
      where: { userId, alliance: { groupId: group.id } },
    });

    const remaining = group.members.filter((m) => m.userId !== userId);
    if (remaining.length === 0) {
      await prisma.group.delete({ where: { id: group.id } });
      return res.json({ ok: true, deleted: true });
    }
    if (group.createdByUserId === userId) {
      // Transfer creator to the oldest remaining member.
      const next = remaining.sort((a, b) => a.joinedAt - b.joinedAt)[0];
      await prisma.group.update({
        where: { id: group.id },
        data: { createdByUserId: next.userId },
      });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to leave group" });
  }
});

// Delete a group (creator only).
router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.body || {};
    const group = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!group) return res.status(404).json({ error: "group not found" });
    if (group.createdByUserId && group.createdByUserId !== userId) {
      return res.status(403).json({ error: "Only the group creator can delete the group" });
    }
    await prisma.group.delete({ where: { id: group.id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete group" });
  }
});

export default router;
