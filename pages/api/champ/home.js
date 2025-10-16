// pages/api/champ/home.js
import prisma from "../../../lib/prisma";

/* helpers */
const toKoDate = (d) => {
  if (!d) return null;
  try {
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return null;
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${y}.${m}.${dd}`;
  } catch { return null; }
};

const tierLabel = (t) => (t >= 120 ? "메이저" : t <= 80 ? "라이트" : "스탠다드");
const modeKo = (m) => (m === "FOURSOME" ? "포썸" : "스트로크");

/* 시즌 포인트/이벤트 리더보드 (기존 그대로) */
const tierMultiplier = (tier) => (tier >= 120 ? 1.2 : tier <= 80 ? 0.8 : 1.0);
async function buildSeasonLeaderboard(seasonId) {
  if (!seasonId) return [];
  const events = await prisma.event.findMany({ where: { seasonId }, select: { id: true, tier: true } });
  if (!events.length) return [];
  const tierById = new Map(events.map((e) => [e.id, e.tier ?? 100]));
  const scores = await prisma.score.findMany({
    where: { eventId: { in: events.map((e) => e.id) }, participantId: { not: null } },
    select: { eventId: true, points: true, participantId: true, participant: { select: { name: true, nickname: true } } },
  });
  const acc = new Map();
  for (const s of scores) {
    const inc = Math.max(0, s.points || 0) * tierMultiplier(tierById.get(s.eventId) || 100);
    if (!acc.has(s.participantId)) acc.set(s.participantId, { name: s.participant?.name || "-", nickname: s.participant?.nickname || "", total: 0 });
    acc.get(s.participantId).total += inc;
  }
  return [...acc.values()].sort((a,b)=>b.total-a.total).slice(0,50).map((v,i)=>({ rank:i+1, name:v.name, nickname:v.nickname, totalPoints:Math.round(v.total) }));
}
async function buildEventLeaderboard(eventId) {
  if (!eventId) return [];
  const rows = await prisma.score.findMany({
    where: { eventId },
    include: { participant: true },
    orderBy: [{ strokes: "asc" }, { createdAt: "asc" }],
    take: 50,
  });
  return rows.map((s,i)=>({ rank:i+1, name:s.participant?.name||"-", nickname:s.participant?.nickname||s.externalNickname, strokes:s.strokes??null, points:s.points??null }));
}

/* handler */
export default async function handler(req, res) {
  try {
    // 공지
    const notices = await prisma.notice.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, createdAt: true, pinned: true, content: true },
    });

    // 현재 이벤트 선택
    const now = new Date();
    const [upcoming, recent, fallback] = await Promise.all([
      prisma.event.findFirst({ where: { playedAt: { gte: now } }, orderBy: { playedAt: "asc" }, include: { season: true } }),
      prisma.event.findFirst({ where: { playedAt: { lt: now } }, orderBy: { playedAt: "desc" }, include: { season: true } }),
      prisma.event.findFirst({ orderBy: { createdAt: "desc" }, include: { season: true } }),
    ]);
    const cur = upcoming || recent || fallback;

    if (!cur) {
      return res.status(200).json({
        currentEvent: null,
        eventLeaderboard: [],
        seasonLeaderboard: [],
        notices,
      });
    }

    // 화면에서 필요한 필드 구성
    const schedule =
      cur.beginAt || cur.endAt
        ? [toKoDate(cur.beginAt), toKoDate(cur.endAt)].filter(Boolean).join(" ~ ")
        : null;

    const title =
      (cur.roundNo ? (cur.roundNo.replace(/[^0-9]/g, "") ? `제${cur.roundNo.replace(/[^0-9]/g, "")}회 ` : `${cur.roundNo} `) : "") +
      (cur.name || "");

    const [eventLeaderboard, seasonLeaderboard] = await Promise.all([
      buildEventLeaderboard(cur.id),
      buildSeasonLeaderboard(cur.seasonId),
    ]);

    return res.status(200).json({
      currentEvent: {
        id: cur.id,
        title,
        name: cur.name,
        roundNo: cur.roundNo || null,
        organizer: cur.organizer || "",        // 주관부서
        beginAt: cur.beginAt,
        endAt: cur.endAt,
        schedule,
        mode: cur.mode,                         // "STROKE" | "FOURSOME"
        modeKo: modeKo(cur.mode),
        tier: cur.tier ?? 100,
        tierLabel: tierLabel(cur.tier ?? 100),
        overview: cur.overview || "",           // 비고/설명
        prizes: cur.prizes || "",
      },
      eventLeaderboard,
      seasonLeaderboard,
      notices,
    });
  } catch (e) {
    console.error("champ home api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
