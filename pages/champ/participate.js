import prisma from "../../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { name, dept, nickname, handicap, password } = req.body || {};

      const _name = String(name || "").trim();
      const _nick = String(nickname || "").trim();
      if (!_name || !_nick) return res.status(400).json({ error: "NAME_AND_NICK_REQUIRED" });

      let _handi = null;
      if (handicap !== undefined && String(handicap).trim() !== "") {
        const n = Number(handicap);
        if (Number.isNaN(n)) return res.status(400).json({ error: "INVALID_HANDICAP" });
        _handi = n;
      }

      const exists = await prisma.participant.findUnique({ where: { nickname: _nick }, select: { id: true } });
      if (exists) return res.status(409).json({ error: "NICKNAME_EXISTS" });

      let passHash = null;
      if (password && String(password).trim()) {
        const bcrypt = (await import("bcryptjs")).default;
        passHash = await bcrypt.hash(String(password).trim(), 10);
      }

      const created = await prisma.participant.create({
        data: {
          name: _name,
          dept: dept ? String(dept).trim() : null,
          nickname: _nick,
          handicap: _handi,
          passHash,
        },
        select: { id: true, name: true, nickname: true },
      });

      return res.status(201).json({ ok: true, participant: created });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
