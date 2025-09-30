// pages/api/champ/participants/set-password.js
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { name, password, nickname } = req.body || {};

    if (!name || !String(name).trim() || !password || !String(password).trim()) {
      return res.status(400).json({ error: "NAME_AND_PASSWORD_REQUIRED" });
    }

    // 1) 이름으로 후보 검색 (유니크 아님)
    const candidates = await prisma.participant.findMany({
      where: { name: String(name).trim() },
      select: { id: true, name: true, nickname: true, passhash: true },
    });

    if (candidates.length === 0) {
      return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });
    }

    // 2) 동명이인 처리
    let target = null;
    if (candidates.length === 1) {
      target = candidates[0];
    } else {
      // 닉네임이 주어지면 그걸로 좁히기
      if (!nickname || !String(nickname).trim()) {
        return res.status(409).json({ error: "AMBIGUOUS_NAME_NEED_NICKNAME" });
      }
      const hit = candidates.find(
        (p) => (p.nickname || "").toLowerCase() === String(nickname).trim().toLowerCase()
      );
      if (!hit) {
        return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });
      }
      target = hit;
    }

    // 3) 이미 비번 설정돼 있으면 막기
    if (target.passhash && String(target.passhash).trim() !== "") {
      return res.status(409).json({ error: "ALREADY_SET" });
    }

    // 4) 해시 생성 후 id로 업데이트 (중요: id는 유니크)
    const passhash = await bcrypt.hash(String(password).trim(), 10);
    await prisma.participant.update({
      where: { id: target.id },
      data: { passhash },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("set-password error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
