// pages/api/champ/me.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    // 로그인: name + password 로 본인 확인 후 참가자/스코어 반환
    if (req.method === "POST") {
      const { name, password } = req.body || {};
      const _name = String(name || "").trim();
      if (!_name || !password) return res.status(400).json({ error: "REQUIRED" });

      // 이름은 중복 가능성이 있으므로, 가장 최근에 업데이트된 1명 우선(사내라 충돌 희박 가정)
      const user = await prisma.participant.findFirst({
        where: { name: _name },
        orderBy: { updatedAt: "desc" },
      });
      if (!user?.passHash) return res.status(403).json({ error: "NO_PASSWORD_SET" });

      const bcrypt = (await import("bcryptjs")).default;
      const ok = await bcrypt.compare(String(password), user.passHash);
      if (!ok) return res.status(403).json({ error: "INVALID_PASSWORD" });

      // 점수/이벤트/시즌 합쳐서 반환
      const scores = await prisma.score.findMany({
        where: { participantId: user.id },
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true, strokes: true, points: true, createdAt: true,
          event: { select: { id: true, name: true, playedAt: true, season: { select: { id: true, name: true, year: true } } } },
        },
      });

      const { passHash, ...safe } = user;
      return res.status(200).json({ ok: true, me: safe, scores });
    }

    // 수정: name + password (현재 비번) 검증 후 기본정보/비번 갱신
    if (req.method === "PUT") {
      const { name, password, dept, nickname, handicap, newPassword } = req.body || {};
      const _name = String(name || "").trim();
      if (!_name || !password) return res.status(400).json({ error: "REQUIRED" });

      const user = await prisma.participant.findFirst({ where: { name: _name }, orderBy: { updatedAt: "desc" } });
      if (!user?.passHash) return res.status(403).json({ error: "NO_PASSWORD_SET" });

      const bcrypt = (await import("bcryptjs")).default;
      const ok = await bcrypt.compare(String(password), user.passHash);
      if (!ok) return res.status(403).json({ error: "INVALID_PASSWORD" });

      const data = {};
      if (dept !== undefined) data.dept = dept ? String(dept).trim() : null;
      if (nickname !== undefined) data.nickname = String(nickname).trim();
      if (handicap !== undefined && String(handicap).trim() !== "") {
        const n = Number(handicap);
        if (Number.isNaN(n)) return res.status(400).json({ error: "INVALID_HANDICAP" });
        data.handicap = n;
      } else if (handicap === "") {
        data.handicap = null;
      }
      if (newPassword !== undefined) {
        data.passHash = newPassword ? await bcrypt.hash(String(newPassword).trim(), 10) : null;
      }

      // 닉네임 중복 체크 (변경 요청 시에만)
      if (data.nickname && data.nickname !== user.nickname) {
        const dupe = await prisma.participant.findUnique({ where: { nickname: data.nickname }, select: { id: true } });
        if (dupe) return res.status(409).json({ error: "NICKNAME_EXISTS" });
      }

      const updated = await prisma.participant.update({
        where: { id: user.id },
        data,
        select: { id: true, name: true, dept: true, nickname: true, handicap: true, updatedAt: true },
      });

      return res.status(200).json({ ok: true, me: updated });
    }

    res.setHeader("Allow", ["POST", "PUT"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
