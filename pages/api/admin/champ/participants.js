// pages/api/admin/champ/participants.js
import bcrypt from "bcryptjs";
import prisma from "../../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

// 관리자 인증 헬퍼
function assertAdmin(req) {
  const token =
    req.headers["x-admin-token"] ||
    req.query.admin ||
    (req.body && req.body.admin);
  return token === ADMIN_PASS;
}

export default async function handler(req, res) {
  try {
    // ───────── 인증 ─────────
    if (!assertAdmin(req)) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    // ───────── GET: 이름/닉네임 검색 ─────────
    if (req.method === "GET") {
      const q = String(req.query.q || "").trim();
      if (!q) return res.status(200).json({ items: [] });

      const items = await prisma.participant.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { nickname: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          dept: true,
          nickname: true,
          handicap: true,
          createdAt: true,
          passwordHash: true,
        },
      });

      const safe = items.map((p) => ({
        id: p.id,
        name: p.name,
        dept: p.dept,
        nickname: p.nickname,
        handicap: p.handicap,
        createdAt: p.createdAt,
        hasPassword: !!p.passwordHash,
      }));

      return res.status(200).json({ items: safe });
    }

    // ───────── PUT: 비밀번호 초기화 ─────────
    if (req.method === "PUT") {
      const { id, newPassword } = req.body || {};
      const pid = Number(id);
      if (!pid || !newPassword || String(newPassword).trim().length < 4) {
        return res.status(400).json({ error: "BAD_REQUEST" });
      }

      const hash = await bcrypt.hash(String(newPassword).trim(), 10);

      const updated = await prisma.participant.update({
        where: { id: pid },
        data: { passwordHash: hash },
        select: { id: true, name: true, nickname: true },
      });

      return res.status(200).json({ ok: true, participant: updated });
    }

    // ───────── DELETE: 참가자 삭제 ─────────
    if (req.method === "DELETE") {
      const { id } = req.body || {};
      const pid = Number(id);
      if (!pid) return res.status(400).json({ error: "BAD_REQUEST" });

      // 1) 시즌 등록 삭제
      await prisma.registration.deleteMany({ where: { participantId: pid } });

      // 2) 점수는 기록 보존 → participantId null 처리
      await prisma.score.updateMany({
        where: { participantId: pid },
        data: { participantId: null, matched: false },
      });

      // 3) 참가자 삭제
      const deleted = await prisma.participant.delete({
        where: { id: pid },
        select: { id: true, name: true, nickname: true },
      });

      return res.status(200).json({ ok: true, participant: deleted });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("admin champ participants api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
