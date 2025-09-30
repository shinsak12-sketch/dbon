import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const seasons = await prisma.season.findMany({
      orderBy: [{ year: "desc" }, { id: "desc" }],
      include: { events: { orderBy: { id: "asc" } } },
    });
    return res.status(200).json({ ok: true, seasons });
  }

  if (req.method === "POST") {
    try {
      const { name, year } = req.body || {};
      if (!name || !year) return res.status(400).json({ error: "REQUIRED_MISSING" });
      const s = await prisma.season.create({ data: { name: String(name), year: Number(year) } });
      return res.status(201).json({ ok: true, season: s });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
