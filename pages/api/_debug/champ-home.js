// pages/api/_debug/champ-home.js
import prisma from "../../../lib/prisma";

const iso = (v) => (v ? new Date(v).toISOString() : null);

export default async function handler(req, res) {
  try {
    const now = new Date();

    // KV 상태
    const kv = await prisma.setting.findUnique({ where: { key: "champ:events" } });
    let kvItems = [];
    try { kvItems = kv?.value ? JSON.parse(kv.value) : []; } catch { kvItems = []; }

    // DB 이벤트 목록(최대 10개만 샘플)
    const events = await prisma.event.findMany({
      orderBy: [{ playedAt: "asc" }, { createdAt: "desc" }],
      take: 10,
      select: { id: true, name: true, playedAt: true, createdAt: true, tier: true,
        season: { select: { id: true, year: true, name: true } } },
    });

    // 홈 로직과 동일한 선택
    const upcoming = await prisma.event.findFirst({
      where: { playedAt: { gte: now } },
      orderBy: { playedAt: "asc" },
      include: { season: true },
    });
    const recent = await prisma.event.findFirst({
      where: { playedAt: { lt: now } },
      orderBy: { playedAt: "desc" },
      include: { season: true },
    });
    const fallback = await prisma.event.findFirst({
      orderBy: { createdAt: "desc" },
      include: { season: true },
    });
    const picked = upcoming || recent || fallback;

    // 공지/점수 카운트
    const [noticeCount, scoreCount] = await Promise.all([
      prisma.notice.count(),
      prisma.score.count(),
    ]);

    return res.status(200).json({
      ok: true,
      now: now.toISOString(),
      kv: {
        exists: !!kv,
        updatedAt: kv?.updatedAt ? kv.updatedAt.toISOString() : null,
        length: Array.isArray(kvItems) ? kvItems.length : 0,
        first: kvItems?.[0] ?? null,
      },
      db: {
        noticeCount,
        scoreCount,
        sampleEvents: events.map(e => ({
          id: e.id, name: e.name, playedAt: iso(e.playedAt),
          createdAt: iso(e.createdAt), tier: e.tier,
          season: e.season ? { id: e.season.id, year: e.season.year, name: e.season.name } : null,
        })),
        picker: {
          reason: picked
            ? (picked.id === upcoming?.id ? "upcoming"
              : picked.id === recent?.id ? "recent"
              : "fallback")
            : "none",
          picked: picked ? {
            id: picked.id, name: picked.name,
            playedAt: iso(picked.playedAt), createdAt: iso(picked.createdAt),
            season: picked.season ? { id: picked.season.id, year: picked.season.year, name: picked.season.name } : null,
            tier: picked.tier ?? 100,
          } : null,
        },
      },
      hint: "홈이 비면: (1) champ:events 가 비어있고 (2) Event.playedAt 이 null이거나 (3) 프론트에서 다른 API를 보고 있을 수 있음.",
    });
  } catch (e) {
    console.error("DEBUG champ-home error:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
