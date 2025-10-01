// pages/api/champ/admin/events.js
import prisma from "../../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

export default async function handler(req, res) {
  try {
    // LIST
    if (req.method === "GET") {
      const items = await prisma.event.findMany({
        orderBy: [{ beginAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true, name: true, slug: true,
          org: true, manager: true, beginAt: true, endAt: true,
          tier: true, state: true, mode: true, adjust: true,
          overview: true, category: true, edition: true,
          createdAt: true, updatedAt: true,
          season: { select: { id: true, name: true } },
        },
      });
      return res.status(200).json({ items });
    }

    // 인증
    const { admin } = (req.body || {});
    if (admin !== ADMIN_PASS) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    // CREATE
    if (req.method === "POST") {
      const {
        org, title, manager, beginAt, endAt,
        tier = 100, state = "개요", mode = "스트로크", adjust = "미적용",
        overview = "", category = null, edition = null,
      } = req.body;

      if (!title) return res.status(400).json({ error: "TITLE_REQUIRED" });

      const created = await prisma.event.create({
        data: {
          name: title,
          slug: null,
          org, manager,
          beginAt: beginAt ? new Date(beginAt) : null,
          endAt: endAt ? new Date(endAt) : null,
          tier: Number(tier) || 100,
          state, mode, adjust,
          overview,
          category,
          edition: edition ? Number(edition) : null,
        },
        select: { id: true, name: true },
      });

      return res.status(201).json({ ok: true, event: created });
    }

    // UPDATE
    if (req.method === "PUT") {
      const {
        id, org, title, manager, beginAt, endAt,
        tier = 100, state = "개요", mode = "스트로크", adjust = "미적용",
        overview = "", category = null, edition = null,
      } = req.body;

      if (!id) return res.status(400).json({ error: "ID_REQUIRED" });

      const updated = await prisma.event.update({
        where: { id: Number(id) },
        data: {
          name: title,
          org, manager,
          beginAt: beginAt ? new Date(beginAt) : null,
          endAt: endAt ? new Date(endAt) : null,
          tier: Number(tier) || 100,
          state, mode, adjust,
          overview,
          category,
          edition: edition ? Number(edition) : null,
        },
        select: { id: true, name: true },
      });

      return res.status(200).json({ ok: true, event: updated });
    }

    // DELETE
    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "ID_REQUIRED" });

      // 점수/연관 데이터가 있으면 먼저 정리 필요(여긴 단순 삭제)
      await prisma.event.delete({ where: { id: Number(id) } });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("admin events api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
