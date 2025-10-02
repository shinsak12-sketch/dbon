// pages/api/champ/home.js
import prisma from "../../../lib/prisma";

/** KV(JSON) 불러오기/저장하기 유틸 */
async function loadKV(key, fallback) {
  const s = await prisma.setting.findUnique({ where: { key } });
  if (!s?.value) return fallback;
  try { return JSON.parse(s.value); } catch { return fallback; }
}

function fmt(dt) {
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.toLocaleString("ko-KR")}`;
  } catch { return null; }
}

function tierMultiplier(tier) {
  if (tier >= 120) return 1.2;
  if (tier <= 80)  return 0.8;
  return 1.0; // 100
}

export default async function handler(req, res) {
  try {
    // ① 공지사항
    const notices = await prisma.notice.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, createdAt: true, pinned: true, content: true },
    });

    // ② 관리자(KV) 방식 이벤트 우선 사용
    const kvEvents = (await loadKV("champ:events", [])) || [];
    const nowMs = Date.now();

    // beginAt 기준으로 "다가오는 → 최근" 우선 선택
    const upcoming = kvEvents
      .filter(e => e.beginAt && Date.parse(e.beginAt) >= nowMs)
      .sort((a,b)=> Date.parse(a.beginAt) - Date.parse(b.beginAt))[0];
    const recent   = kvEvents
      .filter(e => e.beginAt && Date.parse(e.beginAt) < nowMs)
      .sort((a,b)=> Date.parse(b.beginAt) - Date.parse(a.beginAt))[0];
    const kvCurrent = upcoming || recent || kvEvents[0] || null;

    // ③ KV가 있으면 그것으로 응답 구성(리더보드는 추후 점수연동 시 채움)
    if (kvCurrent) {
      const schedule =
        kvCurrent.beginAt && kvCurrent.endAt
          ? `${fmt(kvCurrent.beginAt)} ~ ${fmt(kvCurrent.endAt)}`
          : (kvCurrent.beginAt ? fmt(kvCurrent.beginAt) : "일정 미정");

      return res.status(200).json({
        overview: {
          title: kvCurrent.title || "",
          schedule,
          course: kvCurrent.org || "",                        // 임시: 주관부서 표시
          format: `${kvCurrent.mode || "스트로크"} · 티어 ${kvCurrent.tier ?? 100}`,
          prizes: kvCurrent.overview || "",
        },
        event: { id: kvCurrent.id, title: kvCurrent.title || "" },
        leaderboardEvent: [],     // 점수 DB 연동 전이므로 비움
        leaderboardSeason: [],    // 점수 DB 연동 전이므로 비움
        notices,
      });
    }

    // ④ KV가 없다면 (구) Event 테이블 기반으로 동작 (호환)
    const now = new Date();
    const dbUpcoming = await prisma.event.findFirst({
      where: { playedAt: { gte: now } },
      orderBy: { playedAt: "asc" },
      include: { season: true },
    });
    const dbRecent = await prisma.event.findFirst({
      where: { playedAt: { lt: now } },
      orderBy: { playedAt: "desc" },
      include: { season: true },
    });
    const dbFallback = await prisma.event.findFirst({
      orderBy: { createdAt: "desc" },
      include: { season: true },
    });
    const current = dbUpcoming || dbRecent || dbFallback;

    if (!current) {
      return res.status(200).json({
        overview: null,
        event: null,
        leaderboardEvent: [],
        leaderboardSeason: [],
        notices,
      });
    }

    // 이벤트 리더보드 (예: strokes 오름차순)
    const eventScores = await prisma.score.findMany({
      where: { eventId: current.id },
      include: { participant: true },
      orderBy: [{ strokes: "asc" }, { createdAt: "asc" }],
      take: 50,
    });
    const leaderboardEvent = eventScores.map((s, idx) => ({
      rank: idx + 1,
      name: s.participant?.name || "-",
      nickname: s.participant?.nickname || s.externalNickname,
      strokes: s.strokes ?? null,
      points: s.points ?? null,
    }));

    // 시즌 리더보드 (tier 보정)
    let leaderboardSeason = [];
    if (current.seasonId) {
      const events = await prisma.event.findMany({
        where: { seasonId: current.seasonId },
        select: { id: true, tier: true },
      });

      const byPid = new Map();
      for (const ev of events) {
        const mult = tierMultiplier(ev.tier || 100);
        const rows = await prisma.score.findMany({
          where: { eventId: ev.id, participantId: { not: null } },
          include: { participant: true },
        });
        for (const r of rows) {
          const pid = r.participantId;
          const inc = (r.points || 0) * mult;
          if (!byPid.has(pid)) {
            byPid.set(pid, {
              name: r.participant?.name || "-",
              nickname: r.participant?.nickname || "",
              total: 0,
            });
          }
          byPid.get(pid).total += inc;
        }
      }
      leaderboardSeason = Array.from(byPid.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 50)
        .map((v, i) => ({ rank: i + 1, name: v.name, nickname: v.nickname, totalPoints: Math.round(v.total) }));
    }

    // DB Event 기반 응답(프론트 기대 형식에 맞춤)
    return res.status(200).json({
      overview: {
        title: current.name,
        schedule: current.playedAt ? fmt(current.playedAt) : "일정 미정",
        course: current.season?.name || "",
        format: `티어 ${current.tier ?? 100}`,
        prizes: current.prizes || "",
      },
      event: { id: current.id, title: current.name },
      leaderboardEvent,
      leaderboardSeason,
      notices,
    });
  } catch (e) {
    console.error("champ home api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
