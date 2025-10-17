// pages/api/admin/champ/notices.js
import prisma from "../../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

function assertAdmin(req) {
  const isJSON = (req.headers["content-type"] || "").includes("application/json");
  const pass = isJSON ? req.body?.admin : req.query?.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
}
const t = (s) => String(s ?? "").trim();

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === "GET") {
      const items = await prisma.notice.findMany({
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 100,
        select: { id: true, title: true, content: true, pinned: true, createdAt: true },
      });
      return res.status(200).json({ items });
    }

    if (method === "POST") {
      assertAdmin(req);
      const title = t(req.body?.title);
      const content = t(req.body?.content);
      const pinned = !!req.body?.pinned;
      if (!title || !content) return res.status(400).json({ error: "TITLE_AND_CONTENT_REQUIRED" });

      const item = await prisma.notice.create({
        data: { title, content, pinned },
        select: { id: true, title: true, content: true, pinned: true, createdAt: true },
      });
      return res.status(201).json({ ok: true, item });
    }

    if (method === "PUT") {
      assertAdmin(req);
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: "MISSING_ID" });

      const data = {};
      if (req.body?.title !== undefined) data.title = t(req.body.title);
      if (req.body?.content !== undefined) data.content = t(req.body.content);
      if (req.body?.pinned !== undefined) data.pinned = !!req.body.pinned;

      const item = await prisma.notice.update({
        where: { id },
        data,
        select: { id: true, title: true, content: true, pinned: true, createdAt: true },
      });
      return res.status(200).json({ ok: true, item });
    }

    if (method === "DELETE") {
      assertAdmin(req);
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: "MISSING_ID" });

      const item = await prisma.notice.delete({
        where: { id },
        select: { id: true, title: true },
      });
      return res.status(200).json({ ok: true, item });
    }

    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("admin/champ/notices error:", e);
    const isProd = process.env.NODE_ENV === "production";
    return res.status(e.status || 500).json(isProd ? { error: "SERVER_ERROR" } : { error: "SERVER_ERROR", message: e.message });
  }
}
