// pages/api/admin/champ/settings.js
import prisma from "../../../../lib/prisma";

const KEY = "champ:rules";

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

  try {
    if (method === "GET") {
      const rules = await loadKV(KEY, {
        base: [30, 20, 15, 12, 10, 8, 6, 4, 2, 1],
        tier: { 120: 120, 100: 100, 80: 80 },
      });
      return res.json({ rules });
    }

    if (method === "PUT") {
      const guard = req.body?.admin || req.query.admin;
      if (guard !== "dbsonsa") return res.status(401).json({ error: "UNAUTHORIZED" });

      const rules = req.body?.rules;
      if (!rules) return res.status(400).json({ error: "MISSING_RULES" });

      // 간단 검증
      const ok =
        Array.isArray(rules.base) &&
        rules.tier &&
        [120, 100, 80].every((k) => typeof rules.tier[k] !== "undefined");

      if (!ok) return res.status(400).json({ error: "INVALID_RULES" });

      await saveKV(KEY, rules);
      return res.json({ ok: true });
    }

    res.setHeader("Allow", "GET,PUT");
    return res.status(405).end("Method Not Allowed");
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
