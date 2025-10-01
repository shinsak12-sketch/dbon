import prisma from '../../../lib/prisma';

function tierMultiplier(tier) {
  if (tier >= 120) return 1.2;
  if (tier <= 80)  return 0.8;
  return 1.0; // 100
}

export default async function handler(req, res) {
  try {
    // 공지
    const notices = await prisma.notice.findMany({
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      select: { id: true, title: true, content: true, pinned: true, createdAt: true },
    });

    // 현재 이벤트 선택
    const now = new Date();
    const upcoming = await prisma.event.findFirst({
      where: { playedAt: { gte: now } },
      orderBy: { playedAt: 'asc' },
      include: { season: true },
    });
    const recent = await prisma.event.findFirst({
      where: { playedAt: { lt: now } },
      orderBy: { playedAt: 'desc' },
      include: { season: true },
    });
    const fallback = await prisma.event.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { season: true },
    });

    const current = upcoming || recent || fallback;
    if (!current) {
      return res.status(200).json({
        currentEvent: null,
        eventLeaderboard: [],
        seasonLeaderboard: [],
        notices,
      });
    }

    // 이벤트 리더보드(예: strokes 오름차순 → 필요 시 points/NET 교체 가능)
    const eventScores = await prisma.score.findMany({
      where: { eventId: current.id },
      include: { participant: true },
      orderBy: [{ strokes: 'asc' }, { createdAt: 'asc' }],
      take: 50,
    });
    const eventLeaderboard = eventScores.map((s, idx) => ({
      rank: idx + 1,
      name: s.participant?.name || '-',
      nickname: s.participant?.nickname || s.externalNickname,
      strokes: s.strokes ?? null,
      points: s.points ?? null,
    }));

    // 시즌 포인트(보정): 같은 Season 내 모든 이벤트의 Score.points 합 * tier multiplier
    let seasonLeaderboard = [];
    if (current.seasonId) {
      const events = await prisma.event.findMany({
        where: { seasonId: current.seasonId },
        select: { id: true, tier: true },
      });

      const byPid = new Map(); // pid → { name, nickname, total }
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
              name: r.participant?.name || '-',
              nickname: r.participant?.nickname || '',
              total: 0,
            });
          }
          byPid.get(pid).total += inc;
        }
      }
      seasonLeaderboard = Array.from(byPid.entries())
        .map(([_, v]) => v)
        .sort((a, b) => b.total - a.total)
        .slice(0, 50)
        .map((v, i) => ({
          rank: i + 1,
          name: v.name,
          nickname: v.nickname,
          points: Math.round(v.total),
        }));
    }

    return res.status(200).json({
      currentEvent: {
        id: current.id,
        name: current.name,
        season: current.season ? { id: current.season.id, name: current.season.name, year: current.season.year } : null,
        playedAt: current.playedAt,
        tier: current.tier,
        overview: current.overview,
        rules: current.rules,
        prizes: current.prizes,
        status: current.status,
      },
      eventLeaderboard,
      seasonLeaderboard,
      notices,
    });
  } catch (e) {
    console.error('champ home api error:', e);
    return res.status(500).json({ error: 'SERVER_ERROR' });
  }
}
