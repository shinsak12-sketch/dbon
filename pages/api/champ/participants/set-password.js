// pages/api/champ/participants/set-password.js
import prisma from "../../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { name, password, dept } = req.body || {};
    const realName = String(name || "").trim();
    const rawPw = String(password || "").trim();

    if (!realName || !rawPw) {
      return res.status(400).json({ error: "NAME_AND_PASSWORD_REQUIRED" });
    }

    // 동명이인 안전장치: dept가 오면 함께 매칭, 없으면 같은 이름이 여러 명일 때 에러
    const where = dept && String(dept).trim()
      ? { name: realName, dept: String(dept).trim() }
      : { name: realName };

    const list = await prisma.participant.findMany({
      where,
      select: { id: true, name: true, dept: true, passHash: true },
    });

    if (list.length === 0) {
      return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });
    }
    if (!dept && list.length > 1) {
      // 이름만으로 여러 명이면 확정 불가
      return res.status(409).json({ error: "AMBIGUOUS_NAME_NEEDS_DEPT" });
    }

    const p = list[0];
    if (p.passHash) {
      return res.status(409).json({ error: "ALREADY_SET" });
    }

    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash(rawPw, 10);

    await prisma.participant.update({
      where: { id: p.id },
      data: { passHash: hash },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("set-password API error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
