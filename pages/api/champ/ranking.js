// pages/api/champ/ranking.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    const eventId = Number(req.query.eventId);
    if (!eventId) return res.status(400).json({ error: "MISSING_EVENT_ID" });

    // ① 대회 기본정보
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { season: true },
    });
    if (!event) return res.status(404).json({ error: "EVENT_NOT_FOUND" });

    // ② 점수 및 참가자 정보 로드
    const scores = await prisma.score.findMany({
      where: { eventId },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            type: true, // STAFF / EMPLOYEE / FAMILY
          },
        },
      },
      orderBy: [
        { net: "asc" },
        { strokes: "asc" },
      ],
    });

    // ③ 참가자별 연간평균타 계산
    const avgByParticipant = {};
    const regs = await prisma.registration.findMany({
      where: { seasonId: event.seasonId },
      include: {
        participant: {
          select: { id: true, name: true },
        },
      },
    });

    for (const reg of regs) {
      const scoresInSeason = await prisma.score.findMany({
        where: {
          participantId: reg.participantId,
          event: { seasonId: event.seasonId },
        },
        select: { strokes: true },
      });
      const vals = scoresInSeason.map((s) => s.strokes).filter(Number.isFinite);
      avgByParticipant[reg.participantId] =
        vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
    }

    // ④ 데이터 조립
    const items = scores.map((s, idx) => ({
      rank: idx + 1,
      realName: s.participant?.name || "—",
      nickname: s.externalNickname,
      type:
        s.participant?.type === "FAMILY"
          ? "가족"
          : s.participant?.type === "STAFF" || s.participant?.type === "EMPLOYEE"
          ? "직원"
          : "—",
      strokes: s.strokes ?? null,
      net: s.net ?? null,
      points: s.points ?? 0,
      avgStroke: s.participantId ? avgByParticipant[s.participantId] || "—" : "—",
    }));

    const total = items.length;
    const regCount = items.filter((i) => i.realName !== "—").length;
    const unregCount = total - regCount;

    res.status(200).json({
      ok: true,
      season: { year: event.season.year },
      event: { id: event.id, name: event.name },
      stats: { total, regCount, unregCount },
      items,
    });
  } catch (e) {
    console.error("ranking error:", e);
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
}
