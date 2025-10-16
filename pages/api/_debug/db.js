import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    // DB 연결 체크
    await prisma.$queryRaw`SELECT 1`;
    // 주요 테이블 상태
    const [settings, events, notices] = await Promise.all([
      prisma.setting.findMany({ take: 10, orderBy: { updatedAt: "desc" } }),
      prisma.event.findMany({ take: 5, orderBy: { id: "desc" } }),
      prisma.notice.findMany({ take: 5, orderBy: { id: "desc" } }),
    ]);
    res.status(200).json({
      ok: true,
      now: new Date().toISOString(),
      settingsKeys: settings.map(s => s.key),
      eventsCount: events.length,
      noticesCount: notices.length,
      sample: {
        setting0: settings[0] || null,
        event0: events[0] || null,
        notice0: notices[0] || null,
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message, stack: e.stack });
  }
}
