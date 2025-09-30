import prisma from "../../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  const { name, dept, nickname, handicap } = req.body || {};
  if (!name?.trim() || !nickname?.trim()) return res.status(400).json({ error: "REQUIRED" });
  try {
    const p = await prisma.chParticipant.upsert({
      where: { nickname: nickname.trim() }, // 닉네임 유니크 가정(사내용)
      update: { name: name.trim(), dept: dept?.trim() || null, handicap: handicap || null },
      create: { name: name.trim(), dept: dept?.trim() || null, nickname: nickname.trim(), handicap: handicap || null },
      select: { id: true },
    });
    return res.status(200).json({ ok: true, id: p.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
