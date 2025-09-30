import prisma from "../../../../../lib/prisma";

export default async function handler(req, res) {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "INVALID_ID" });

  const event = await prisma.chEvent.findUnique({
    where: { id },
    include: { season: true },
  });
  if (!event) return res.status(404).json({ error: "NOT_FOUND" });

  // net → gross → 이름 순으로 정렬
  const results = await prisma.chResult.findMany({
    where: { eventId: id },
    include: { participant: true },
    orderBy: [{ net: "asc" }, { gross: "asc" }],
  });

  const rows = results.map((r) => ({
    participantId: r.participantId,
    name: r.participant.name,
    nickname: r.participant.nickname,
    gross: r.gross,
    net: r.net,
  }));

  return res.status(200).json({ event, results: rows });
}
