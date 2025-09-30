import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { seasonId, name, playedAt } = req.body || {};
      if (!seasonId || !name) return res.status(400).json({ error: "REQUIRED_MISSING" });
      const ev = await prisma.event.create({
        data: { seasonId: Number(seasonId), name: String(name), playedAt: playedAt ? new Date(playedAt) : null },
      });
      return res.status(201).json({ ok: true, event: ev });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
