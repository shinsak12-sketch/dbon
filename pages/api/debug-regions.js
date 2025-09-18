// pages/api/debug-regions.js
import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, name, slug FROM "Region" ORDER BY id ASC LIMIT 100`
    );
    res.json({ count: rows.length, rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
