// pages/api/champ/me.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST  /api/champ/me      -> 로그인(이름+비번)
 * PUT   /api/champ/me      -> 내 정보 수정 / 비번변경
 *  - 최초 비번 미설정 상태(passwordHash=null)일 때도 안전하게 처리
 */

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { name, password } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: "NAME_REQUIRED" });
      }
      const me = await prisma.participant.findFirst({
        where: { name: String(name).trim() },
      });
      if (!me) return res.status(404).json({ error: "NOT_FOUND" });

      // 비밀번호 미설정
      if (!me.passwordHash) {
        return res.status(409).json({ error: "NO_PASSWORD_SET" });
      }

      const ok = await bcrypt.compare(String(password || ""), me.passwordHash);
      if (!ok) return res.status(403).json({ error: "INVALID_PASSWORD" });

      const scores = await prisma.score.findMany({
        where: { participantId: me.id },
        orderBy: { id: "desc" },
        include: { event: { include: { season: true } } },
      });
      return res.status(200).json({ me, scores });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  if (req.method === "PUT") {
    try {
      const {
        name,           // 로그인/식별용
        password,       // 현재 비번(변경 아님)
        // 수정 필드
        dept,
        nickname,
        handicap,
        newPassword,    // 새 비번(설정/변경 공용)
      } = req.body || {};

      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: "NAME_REQUIRED" });
      }

      const me = await prisma.participant.findFirst({
        where: { name: String(name).trim() },
      });
      if (!me) return res.status(404).json({ error: "NOT_FOUND" });

      // ===== A) 최초 설정 분기 (passwordHash가 없음) =====
      if (!me.passwordHash) {
        if (!newPassword || String(newPassword).trim().length < 4) {
          return res.status(400).json({ error: "NEW_PASSWORD_TOO_SHORT" });
        }
        const hash = await bcrypt.hash(String(newPassword).trim(), 10);
        const updated = await prisma.participant.update({
          where: { id: me.id },
          data: {
            passwordHash: hash,
            // 프로필 필드도 같이 수정 허용
            dept: typeof dept === "string" ? dept : me.dept,
            nickname: typeof nickname === "string" ? nickname : me.nickname,
            handicap:
              typeof handicap === "string" && handicap !== ""
                ? Number(handicap)
                : typeof handicap === "number"
                ? handicap
                : me.handicap,
          },
        });
        return res.status(200).json({ me: updated, firstSet: true });
      }

      // ===== B) 일반 수정/변경: 현재 비번 검증 후 진행 =====
      const ok = await bcrypt.compare(String(password || ""), me.passwordHash);
      if (!ok) return res.status(403).json({ error: "INVALID_PASSWORD" });

      const data = {
        dept: typeof dept === "string" ? dept : me.dept,
        nickname: typeof nickname === "string" ? nickname : me.nickname,
        handicap:
          typeof handicap === "string" && handicap !== ""
            ? Number(handicap)
            : typeof handicap === "number"
            ? handicap
            : me.handicap,
      };

      if (newPassword && String(newPassword).trim().length >= 4) {
        data.passwordHash = await bcrypt.hash(String(newPassword).trim(), 10);
      }

      const updated = await prisma.participant.update({
        where: { id: me.id },
        data,
      });

      return res.status(200).json({ me: updated });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  res.setHeader("Allow", ["POST", "PUT"]);
  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
