// pages/api/champ/participants/index.js
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { name, dept, nickname, handicap, password } = req.body || {};

      const _name = String(name || "").trim();
      const _nick = String(nickname || "").trim();
      if (!_name || !_nick) {
        return res.status(400).json({ error: "NAME_AND_NICK_REQUIRED" });
      }

      // ✅ 비밀번호 필수/검증
      const _pw = String(password || "").trim();
      if (_pw.length < 4) {
        return res.status(400).json({ error: "PASSWORD_REQUIRED" });
      }

      // 핸디 숫자 처리 (빈문자면 null)
      let _handi = null;
      if (handicap !== undefined && handicap !== null && String(handicap).trim() !== "") {
        const n = Number(handicap);
        if (Number.isNaN(n)) return res.status(400).json({ error: "INVALID_HANDICAP" });
        _handi = n;
      }

      // 닉네임 고유
      const exists = await prisma.participant.findUnique({
        where: { nickname: _nick },
        select: { id: true },
      });
      if (exists) return res.status(409).json({ error: "NICKNAME_EXISTS" });

      // ✅ 비밀번호 해시
      const passwordHash = await bcrypt.hash(_pw, 10);

      // 생성
      const created = await prisma.participant.create({
        data: {
          name: _name,
          dept: dept ? String(dept).trim() : null,
          nickname: _nick,
          handicap: _handi,
          passwordHash,              // ✅ 해시 저장 (필드명 정확히!)
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
