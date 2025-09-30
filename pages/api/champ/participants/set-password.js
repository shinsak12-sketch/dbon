// pages/api/champ/participants/set-password.js
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

/**
 * 최초 비번 설정용 엔드포인트
 * body: { name, nickname?, password }
 * - nickname이 있으면 name+nickname 둘 다 매칭
 * - passHash가 이미 있으면 ALREADY_SET
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { name, nickname, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: "NAME_AND_PASSWORD_REQUIRED" });
    }

    const where = nickname
      ? { name: String(name).trim(), nickname: String(nickname).trim() }
      : { name: String(name).trim() };

    const p = await prisma.participant.findFirst({ where });
    if (!p) return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });

    if (p.passHash) {
      return res.status(409).json({ error: "ALREADY_SET" });
    }

    const hash = await bcrypt.hash(String(password).trim(), 10);
    await prisma.participant.update({
      where: { id: p.id },
      data: { passHash: hash },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
