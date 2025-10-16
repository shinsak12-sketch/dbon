// pages/api/champ/home.js
import prisma from "../../../lib/prisma";

/* ---------- helpers ---------- */
function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${dd}`;
}
function fmtRange(startISO, endISO) {
  const s = fmtDate(startISO);
  const e = fmtDate(endISO);
  if (s && e) return `${s} ~ ${e}`;
  return s || e || "일정 미정";
}
const tierName = (t) => (t >= 120 ? "메이저" : t <= 80 ? "라이트" : "스탠다드");
const tierMultiplier = (tier) => (tier >= 120 ? 1.2 : tier <= 80 ? 0.8 : 1.0);

// rules 문자열에서 "키:값" 형태 뽑기 (예: "방식:스트로크 · 보정:미적용 · 부서:손사지원")
function pickFromRules(rules = "", key) {
  const re = new RegExp(`${key}\\s*:\\s*([^·]+)`);
  const m = (rules || "").match(re);
  return m ? m[1].trim() : "";
}

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

  const acc = new Map();
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
    .map((v, i) => ({ rank: i + 1, name: v.name, nickname: v.nickname, totalPoints: Math.round(v.total) }));
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
        currentEvent: null,
        eventLeaderboard: [],
        seasonLeaderboard: [],
        notices,
      });
    }

    // ③ rules 파싱해서 organizer/mode/adjust 뽑기
    const organizer = pickFromRules(current.rules, "부서") || ""; // 주관부서
    const mode = pickFromRules(current.rules, "방식") || "";     // 스트로크/포썸 등
    const adjust = pickFromRules(current.rules, "보정") || "";   // 적용/미적용

    // ④ 리더보드 계산
    const [eventLeaderboard, seasonLeaderboard] = await Promise.all([
      buildEventLeaderboard(current.id),
      buildSeasonLeaderboard(current.seasonId),
    ]);

    // ⑤ 응답(프론트에서 바로 사용)
    return res.status(200).json({
      currentEvent: {
        id: current.id,
        name: current.name,
        // 날짜: 시분초 제거, endAt 있으면 범위로 표시 (스키마에 endAt 추가되면 자동 반영됨)
        playedAt: current.playedAt,
        endAt: current.endAt ?? null, // 스키마에 없으면 항상 null
        scheduleText: fmtRange(current.playedAt, current.endAt ?? null),

        // 주관/방식/티어/비고
        organizer,                                // ✅ 주관부서 (rules에서 추출)
        mode,                                     // ✅ 게임방식
        adjust,                                   // (참고) 보정 여부
        tier: current.tier ?? 100,
        tierName: tierName(current.tier ?? 100),  // 메이저/스탠다드/라이트
        prizes: current.prizes || "",             // ✅ 상품/비고
        overview: current.overview || "",         // (필요 시 사용)
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
