import prisma from "../../../../../lib/prisma";

export default async function handler(req, res) {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "INVALID_ID" });

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const { rows } = req.body || {};
  if (!Array.isArray(rows)) return res.status(400).json({ error: "ROWS_REQUIRED" });

  try {
    let matched = 0, ignored = 0;

    for (const r of rows) {
      const nick = String(r.nickname || "").trim();
      if (!nick) { ignored++; continue; }

      const participant = await prisma.chParticipant.findUnique({ where: { nickname: nick } });
      if (!participant) { ignored++; continue; }

      // upsert 결과
      await prisma.chResult.upsert({
        where: { eventId_participantId: { eventId: id, participantId: participant.id } },
        update: { gross: r.gross ?? null, net: r.net ?? null },
        create: { eventId: id, participantId: participant.id, gross: r.gross ?? null, net: r.net ?? null },
      });
      matched++;
    }

    // 포인트 갱신(간단: net 오름차순 순위에 따라 25-18-15-... 규칙 등은 이후 구현)
    // 여기선 일단 스코어 저장까지만.
    return res.status(200).json({ ok: true, matched, ignored });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
