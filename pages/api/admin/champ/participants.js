// pages/api/champ/admin/participants.js
import bcrypt from "bcryptjs";
import prisma from "../../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

export default async function handler(req, res) {
  try {
    // GET: 이름/닉네임(부분일치, 대소문자무시) 검색
    if (req.method === "GET") {
      const { q = "", admin = "" } = req.query;
      if (admin !== ADMIN_PASS) return res.status(401).json({ error: "UNAUTHORIZED" });

      const keyword = String(q).trim();
      if (!keyword) return res.status(200).json({ items: [] });

      const items = await prisma.participant.findMany({
        where: {
          OR: [
            { name: { contains: keyword, mode: "insensitive" } },
            { nickname: { contains: keyword, mode: "insensitive" } },
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
          passwordHash: true, // 🔁 필드명 통일
        },
      });

      // 해시는 클라이언트에 노출하지 않음
      const safe = items.map((p) => ({
        id: p.id,
        name: p.name,
        dept: p.dept,
        nickname: p.nickname,
        handicap: p.handicap,
        createdAt: p.createdAt,
        hasPassword: !!p.passwordHash, // 🔁
      }));

      return res.status(200).json({ items: safe });
    }

    // PUT: 비밀번호 초기화
    if (req.method === "PUT") {
      const { admin, id, newPassword } = req.body || {};
      if (admin !== ADMIN_PASS) return res.status(401).json({ error: "UNAUTHORIZED" });

      const pid = Number(id);
      if (!pid || !newPassword || String(newPassword).trim().length < 4) {
        return res.status(400).json({ error: "BAD_REQUEST" });
      }

      const hash = await bcrypt.hash(String(newPassword).trim(), 10);

      const updated = await prisma.participant.update({
        where: { id: pid },
        data: { passwordHash: hash }, // 🔁
        select: { id: true, name: true, nickname: true },
      });

      return res.status(200).json({ ok: true, participant: updated });
    }

    // DELETE: 참가자 삭제 (연관 스코어 정리)
    if (req.method === "DELETE") {
      const { admin, id } = req.body || {};
      if (admin !== ADMIN_PASS) return res.status(401).json({ error: "UNAUTHORIZED" });

      const pid = Number(id);
      if (!pid) return res.status(400).json({ error: "BAD_REQUEST" });

      await prisma.score.deleteMany({ where: { participantId: pid } });
      const deleted = await prisma.participant.delete({
        where: { id: pid },
        select: { id: true, name: true, nickname: true },
      });

      return res.status(200).json({ ok: true, participant: deleted });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("admin participants api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
