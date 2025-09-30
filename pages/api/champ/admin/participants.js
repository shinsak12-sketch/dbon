// pages/api/champ/admin/participants.js
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 클라이언트와 같은 비번을 쓰되, 가능하면 env로 옮기세요.
const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

export default async function handler(req, res) {
  try {
    // ---- GET: 이름/닉네임으로 검색 ----
    if (req.method === "GET") {
      const { q = "", admin = "" } = req.query;
      if (admin !== ADMIN_PASS) {
        return res.status(401).json({ error: "UNAUTHORIZED" });
      }
      const keyword = String(q).trim();
      if (!keyword) return res.status(200).json({ items: [] });

      const items = await prisma.participant.findMany({
        where: {
          OR: [
            { name: { contains: keyword } },
            { nickname: { contains: keyword } },
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
          passwordHash: true, // nullable
        },
      });

      // 클라이언트에 해시를 직접 보내지 않음
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

    // ---- PUT: 특정 참가자 비번 초기화 ----
    if (req.method === "PUT") {
      const { admin, id, newPassword } = req.body || {};
      if (admin !== ADMIN_PASS) {
        return res.status(401).json({ error: "UNAUTHORIZED" });
      }
      const pid = Number(id);
      if (!pid || !newPassword || String(newPassword).length < 4) {
        return res.status(400).json({ error: "BAD_REQUEST" });
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(String(newPassword), salt);

      const updated = await prisma.participant.update({
        where: { id: pid },
        data: { passwordHash: hash },
        select: { id: true, name: true, nickname: true },
      });

      return res.status(200).json({ ok: true, participant: updated });
    }

    // 메서드 미지원
    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("admin participants api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
