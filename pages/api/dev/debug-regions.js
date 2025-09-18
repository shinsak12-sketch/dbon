import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const rows = await prisma.region.findMany({ select: { id: true, name: true, slug: true } });
    res.json({ count: rows.length, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
