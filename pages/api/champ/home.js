// pages/api/champ/home.js
import prisma from "../../../lib/prisma";

const safeParse = (s, fallback) => {
  try {
    if (!s || typeof s !== "string") return fallback;
    const v = JSON.parse(s);
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

export default async function handler(req, res) {
  try {
    // 1) 시즌 선택: open > 최신 year
    let season =
      (await prisma.season.findFirst({ where: { status: "open" } })) ||
      (await prisma.season.findFirst({ orderBy: { year: "desc" } }));
    if (!season) {
      return res.status(200).json({
        season: null,
        event: null,
        overview: null,
        leaderboardEvent: [],
        leaderboardSeason: [],
        notices: [],
      });
    }

    // 2) 현재/진행중 대회 (없을 수 있음)
    const event =
      (await prisma.event.findFirst({
        where: { seasonId: season.id, status: { in: ["open", "published"] } },
        orderBy: [{ playedAt: "desc" }, { updatedAt: "desc" }],
      })) || null;

    // 3) 개요/공지 (Setting)
    const [overviewSetting, noticesSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "champ:overview" } }),
      prisma.setting.findUnique({ where: { key: "champ:notices" } }),
    ]);

    const overview =
      safeParse(overviewSetting?.value, null) ||
      (event
        ? {
            title: `${season.name} · ${event.name}`,
            schedule: event.playedAt
              ? new Date(event.playedAt).toLocaleDateString("ko-KR")
              : "일정 미정",
            course: "",
            format: "",
            prizes: "",
          }
        : null);

    const notices = Array.isArray(safeParse(noticesSetting?.value, []))
      ? safeParse(noticesSetting?.value, [])
      : [];

    // 4) 대회 리더보드 (현재 이벤트 있을 때만)
    let leaderboardEvent = [];
    if (event) {
      const rows = await prisma.score.findMany({
        where: { eventId: event.id, strokes: { not: null } },
        include: { participant: true },
        orderBy: [{ strokes: "asc" }, { createdAt: "asc" }],
        take: 10,
      });
      leaderboardEvent = rows.map((r, i) => ({
        rank: i + 1,
        name: r.participant?.name || "-",
        nickname: r.participant?.nickname || r.externalNickname || "-",
        strokes: r.strokes,
        points: r.points ?? 0,
      }));
    }

    // 5) 시즌 포인트 리더보드 (시즌 전체 합산)
    const seasonPoints = await prisma.score.groupBy({
      by: ["participantId"],
      where: {
        points: { not: null },
        event: { seasonId: season.id },
      },
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
      take: 50, // 넉넉히 뽑아서 아래에서 이름 붙임 → 상위 10만 반환
    });

    // 참가자 정보 붙이기
    const ids = seasonPoints.map((r) => r.participantId).filter(Boolean);
    const participants = await prisma.participant.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, nickname: true },
    });
    const pmap = new Map(participants.map((p) => [p.id, p]));

    const leaderboardSeason = seasonPoints
      .slice(0, 10)
      .map((r, i) => {
        const p = pmap.get(r.participantId);
        return {
          rank: i + 1,
          name: p?.name || "-",
          nickname: p?.nickname || "-",
          totalPoints: r._sum.points || 0,
        };
      });

    return res.status(200).json({
      season: { id: season.id, name: season.name, year: season.year, slug: season.slug },
      event: event
        ? {
            id: event.id,
            name: event.name,
            slug: event.slug,
            playedAt: event.playedAt,
            status: event.status,
          }
        : null,
      overview,
      leaderboardEvent,
      leaderboardSeason,
      notices,
    });
  } catch (e) {
    console.error("champ/home api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
