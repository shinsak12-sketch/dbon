// pages/api/debug-db.js
import prisma from "../../lib/prisma";

function mask(url = "") {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  try {
    const info = await prisma.$queryRawUnsafe(`
      SELECT
        current_database() AS db,
        current_user AS user,
        current_schema() AS schema,
        inet_server_addr()::text AS host_ip,
        inet_server_port()::text AS host_port,
        version() AS version
    `);

    // Region/Place 테이블 존재/카운트 확인
    const regionExists = await prisma.$queryRawUnsafe(`
      SELECT to_regclass('public."Region"') IS NOT NULL AS exists
    `);
    const placeExists = await prisma.$queryRawUnsafe(`
      SELECT to_regclass('public."Place"") IS NOT NULL AS exists
    `).catch(() => [{ exists: false }]);

    const regionCount = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "Region"`
    ).catch(() => [{ count: 0 }]);

    const placeCount = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "Place"`
    ).catch(() => [{ count: 0 }]);

    res.json({
      database_url: mask(process.env.DATABASE_URL || ""),
      connection: info?.[0] || null,
      tables: {
        Region: { exists: !!regionExists?.[0]?.exists, count: regionCount?.[0]?.count ?? 0 },
        Place: { exists: !!placeExists?.[0]?.exists, count: placeCount?.[0]?.count ?? 0 },
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
}
