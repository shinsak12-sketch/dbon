// pages/api/admin/champ/notices.js
import prisma from "../../../../lib/prisma";

const KEY = "champ:notices";

async function loadKV(key, fallback) {
  const s = await prisma.setting.findUnique({ where: { key } });
  if (!s?.value) return fallback;
  try { return JSON.parse(s.value); } catch { return fallback; }
}
async function saveKV(key, val) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(val ?? null) },
    create: { key, value: JSON.stringify(val ?? null) },
  });
}

export default async function handler(req, res) {
  const { method } = req;

  if (method !== "GET") {
    const guard = req.body?.admin || req.query.admin;
    if (guard !== "dbsonsa") return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  try {
    const list = (await loadKV(KEY, [])) || [];

    if (method === "GET") {
      const items = [...list].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return res.json({ items });
    }

    if (method === "POST") {
      const b = req.body || {};
      const item = {
        id: Date.now(),
        title: String(b.title || ""),
        content: String(b.content || ""),
        pinned: !!b.pinned,
        createdAt: new Date().toISOString(),
      };
      await saveKV(KEY, [item, ...list]);
      return res.status(201).json({ ok: true, item });
    }

    if (method === "PUT") {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: "MISSING_ID" });
      const idx = list.findIndex((x) => x.id === b.id);
      if (idx === -1) return res.status(404).json({ error: "NOT_FOUND" });

      const updated = {
        ...list[idx],
        title: String(b.title ?? list[idx].title),
        content: String(b.content ?? list[idx].content),
        pinned: typeof b.pinned === "boolean" ? b.pinned : list[idx].pinned,
      };
      const next = [...list];
      next[idx] = updated;
      await saveKV(KEY, next);
      return res.json({ ok: true, item: updated });
    }

    if (method === "DELETE") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "MISSING_ID" });
      await saveKV(KEY, list.filter((x) => x.id !== id));
      return res.json({ ok: true });
    }

    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    return res.status(405).end("Method Not Allowed");
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
