import prisma from "../../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { seasonTitle, eventTitle, date, course, scoring = "STROKE", weight = 1 } = req.body || {};
    if (!seasonTitle?.trim() || !eventTitle?.trim()) return res.status(400).json({ error: "REQUIRED" });

    try {
      const season = await prisma.chSeason.upsert({
        where: { title: seasonTitle.trim() },
        update: {},
        create: { title: seasonTitle.trim() },
      });
      const ev = await prisma.chEvent.create({
        data: {
          seasonId: season.id,
          title: eventTitle.trim(),
          date: date ? new Date(date) : null,
          course: course?.trim() || null,
          scoring,
          weight: Number(weight) || 1,
        },
        select: { id: true },
      });
      return res.status(200).json({ ok: true, id: ev.id });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  if (req.method === "GET") {
    const events = await prisma.chEvent.findMany({
      orderBy: [{ date: "desc" }, { id: "desc" }],
      include: { season: true },
    });
    return res.status(200).json({ events });
  }

  res.setHeader("Allow", ["POST", "GET"]);
  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
