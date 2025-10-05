// pages/api/champ/home.js
import prisma from "../../../lib/prisma";

/* ---------- helpers ---------- */
const fmt = (dt) => {
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("ko-KR");
  } catch {
    return null;
  }
};
const tierMultiplier = (tier) => (tier >= 120 ? 1.2 : tier <= 80 ? 0.8 : 1.0);

/** 시즌 포인트 리더보드 (모든 이벤트 점수 한 번에 합산) */
async function buildSeasonLeaderboard(seasonId) {
  if (!seasonId) return [];

  const events = await prisma.event.findMany({
    where: { seasonId },
    select: { id: true, tier: true },
  });
  if (!events.length) return [];

  const tierByEventId = new Map(events.map((e) => [e.id, e.tier ?? 100]));
  const scores = await prisma.score.findMany({
    where: { eventId: { in: events.map((e) => e.id) }, participantId: { not: null } },
    select: {
      eventId: true,
      points: true,
      participantId: true,
      participant: { select: { name: true, nickname: true } },
    },
  });

  const acc = new Map(); // pid -> {name,nickname,total}
  for (const r of scores) {
    const mult = tierMultiplier(tierByEventId.get(r.eventId) || 100);
    const inc = Math.max(0, r.points || 0) * mult;
    if (!acc.has(r.participantId)) {
      acc.set(r.participantId, {
        name: r.participant?.name || "-",
        nickname: r.participant?.nickname || "",
        total: 0,
      });
    }
    acc.get(r.participantId).total += inc;
  }

  return Array.from(acc.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 50)
    .map((v, i) => ({
      rank: i + 1,
      name: v.name,
      nickname: v.nickname,
      totalPoints: Math.round(v.total),
    }));
}

/** 이벤트 리더보드 (strokes 오름차순, 동점 createdAt) */
async function buildEventLeaderboard(eventId) {
  if (!eventId) return [];
  const rows = await prisma.score.findMany({
    where: { eventId },
    include: { participant: true },
    orderBy: [{ strokes: "asc" }, { createdAt: "asc" }],
    take: 50,
  });
  return rows.map((s, i) => ({
    rank: i + 1,
    name: s.participant?.name || "-",
    nickname: s.participant?.nickname || s.externalNickname,
    strokes: s.strokes ?? null,
    points: s.points ?? null,
  }));
}

/* ---------- handler ---------- */
export default async function handler(req, res) {
  try {
    // ① 공지사항(고정 우선)
    const notices = await prisma.notice.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, createdAt: true, pinned: true, content: true },
    });

    // ② 현재 이벤트 선택: (다가오는 playedAt) → (가장 최근 playedAt) → (가장 최근 생성)
    const now = new Date();
    const [upcoming, recent, fallback] = await Promise.all([
      prisma.event.findFirst({
        where: { playedAt: { gte: now } },
        orderBy: { playedAt: "asc" },
        include: { season: true },
      }),
      prisma.event.findFirst({
        where: { playedAt: { lt: now } },
        orderBy: { playedAt: "desc" },
        include: { season: true },
      }),
      prisma.event.findFirst({
        orderBy: { createdAt: "desc" },
        include: { season: true },
      }),
    ]);
    const current = upcoming || recent || fallback;

    if (!current) {
      return res.status(200).json({
        overview: null,
        event: null,
        leaderboardEvent: [],
        leaderboardSeason: [],
        notices,
      });
    }

    // ③ 리더보드 계산
    const [eventLeaderboard, seasonLeaderboard] = await Promise.all([
      buildEventLeaderboard(current.id),
      buildSeasonLeaderboard(current.seasonId),
    ]);

    // ④ 응답(프론트 기대 스키마)
    return res.status(200).json({
      overview: {
        title: current.name,
        schedule: current.playedAt ? fmt(current.playedAt) : "일정 미정",
        course: current.season?.name || "",            // 필요하면 코스/장소 필드로 교체
        format: `티어 ${current.tier ?? 100}`,         // rules/overview에 모드/보정 요약이 있을 수 있음
        prizes: current.prizes || "",
      },
      event: { id: current.id, title: current.name },
      leaderboardEvent: eventLeaderboard,
      leaderboardSeason: seasonLeaderboard,
      notices,
    });
  } catch (e) {
    console.error("champ home api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
