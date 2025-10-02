// pages/api/champ/home.js
import prisma from "../../../lib/prisma";

/** ----- Helpers ----- */
async function loadKV(key, fallback) {
  const s = await prisma.setting.findUnique({ where: { key } });
  if (!s?.value) return fallback;
  try { return JSON.parse(s.value); } catch { return fallback; }
}
const fmt = (dt) => {
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("ko-KR");
  } catch { return null; }
};
const tierMultiplier = (tier) => (tier >= 120 ? 1.2 : tier <= 80 ? 0.8 : 1.0);

/** 시즌 포인트 리더보드 계산 (이벤트들 + 점수 한 번에 조회) */
async function buildSeasonLeaderboard(seasonId) {
  if (!seasonId) return [];

  // 시즌의 모든 이벤트(id, tier) 조회
  const events = await prisma.event.findMany({
    where: { seasonId },
    select: { id: true, tier: true },
  });
  if (!events.length) return [];

  const tierByEventId = new Map(events.map((e) => [e.id, e.tier ?? 100]));
  const eventIds = events.map((e) => e.id);

  // 해당 이벤트들의 점수 전부 한 번에 가져오기 (참가자 조인)
  const scores = await prisma.score.findMany({
    where: { eventId: { in: eventIds }, participantId: { not: null } },
    select: {
      eventId: true,
      points: true,
      participantId: true,
      participant: { select: { id: true, name: true, nickname: true } },
    },
  });

  const acc = new Map(); // pid -> {name,nickname,total}
  for (const r of scores) {
    const mult = tierMultiplier(tierByEventId.get(r.eventId) || 100);
    const inc = Math.max(0, r.points || 0) * mult;
    const pid = r.participantId;
    if (!acc.has(pid)) {
      acc.set(pid, {
        name: r.participant?.name || "-",
        nickname: r.participant?.nickname || "",
        total: 0,
      });
    }
    acc.get(pid).total += inc;
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

/** 대회(이벤트) 리더보드 계산: strokes 오름차순 → tie 시 createdAt */
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

/** ----- Handler ----- */
export default async function handler(req, res) {
  try {
    // ① 공지사항(상단 고정 우선)
    const notices = await prisma.notice.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, createdAt: true, pinned: true, content: true },
    });

    // ② Setting 기반 이벤트 우선
    const kvEvents = (await loadKV("champ:events", [])) || [];
    if (kvEvents.length) {
      const now = Date.now();
      const upcoming = kvEvents
        .filter((e) => e.beginAt && Date.parse(e.beginAt) >= now)
        .sort((a, b) => Date.parse(a.beginAt) - Date.parse(b.beginAt))[0];
      const recent = kvEvents
        .filter((e) => e.beginAt && Date.parse(e.beginAt) < now)
        .sort((a, b) => Date.parse(b.beginAt) - Date.parse(a.beginAt))[0];
      const cur = upcoming || recent || kvEvents[0];

      // overview 구성
      const schedule =
        cur.beginAt && cur.endAt
          ? `${fmt(cur.beginAt)} ~ ${fmt(cur.endAt)}`
          : cur.beginAt
          ? fmt(cur.beginAt)
          : "일정 미정";

      // 리더보드: 설정 항목에 dbEventId가 있으면 해당 이벤트/시즌으로 계산
      let eventLeaderboard = [];
      let seasonLeaderboard = [];
      if (cur.dbEventId) {
        const [ev, evLB] = await Promise.all([
          prisma.event.findUnique({
            where: { id: Number(cur.dbEventId) },
            select: { id: true, seasonId: true },
          }),
          buildEventLeaderboard(Number(cur.dbEventId)),
        ]);
        eventLeaderboard = evLB;
        if (ev?.seasonId) {
          seasonLeaderboard = await buildSeasonLeaderboard(ev.seasonId);
        }
      }

      return res.status(200).json({
        overview: {
          title: cur.title || "",
          schedule,
          course: cur.org || "", // 필요 시 '장소'로 변경 가능
          format: `${cur.mode || "스트로크"} · 티어 ${cur.tier ?? 100}`,
          prizes: cur.overview || "",
        },
        event: { id: cur.id, title: cur.title || "" },
        leaderboardEvent: eventLeaderboard,
        leaderboardSeason: seasonLeaderboard,
        notices,
      });
    }

    // ③ Setting이 비어있으면 Event 테이블 기반(레거시 호환)
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

    const [eventLeaderboard, seasonLeaderboard] = await Promise.all([
      buildEventLeaderboard(current.id),
      buildSeasonLeaderboard(current.seasonId),
    ]);

    return res.status(200).json({
      overview: {
        title: current.name,
        schedule: current.playedAt ? fmt(current.playedAt) : "일정 미정",
        course: current.season?.name || "",
        format: `티어 ${current.tier ?? 100}`,
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
