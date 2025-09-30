// pages/api/champ/set-password.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { name, newPassword } = req.body || {};
    if (!name || !newPassword) {
      return res.status(400).json({ error: "NAME_AND_PASSWORD_REQUIRED" });
    }

    // 참가자 찾기 (동명이인 방지를 위해 name은 고유라고 가정)
    const p = await prisma.participant.findUnique({
      where: { name: String(name).trim() },
      select: { id: true, passHash: true },
    });

    if (!p) return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });
    if (p.passHash) return res.status(409).json({ error: "ALREADY_HAS_PASSWORD" });

    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash(String(newPassword), 10);

    await prisma.participant.update({
      where: { id: p.id },
      data: { passHash: hash },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("set-password error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
