// pages/api/champ/home.js
import prisma from "../../../lib/prisma";

/* helpers */
const ymd = (dt) => {
  try {
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return null;
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  } catch { return null; }
};
const tierKo = (n) => (n === 120 ? "메이저(120)" : n === 100 ? "스탠다드(100)" : n === 80 ? "라이트(80)" : `티어 ${n}`);
const modeKo = (m) => (m === "FOURSOME" ? "포썸" : "스트로크");

export default async function handler(req, res) {
  try {
    // ① 공지사항
    const notices = await prisma.notice.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, content: true, pinned: true, createdAt: true },
    });

    // ② 현재 이벤트 선택: beginAt 기준
    const now = new Date();
    const [upcoming, recent, fallback] = await Promise.all([
      prisma.event.findFirst({ where: { beginAt: { gte: now } }, orderBy: { beginAt: "asc" }, include: { season: true } }),
      prisma.event.findFirst({ where: { beginAt: { lt: now } }, orderBy: { beginAt: "desc" }, include: { season: true } }),
      prisma.event.findFirst({ orderBy: { createdAt: "desc" }, include: { season: true } }),
    ]);
    const ev = upcoming || recent || fallback;

    if (!ev) {
      return res.status(200).json({ currentEvent: null, notices, eventLeaderboard: [], seasonLeaderboard: [] });
    }

    const schedule = ev.beginAt || ev.endAt
      ? [ymd(ev.beginAt), ymd(ev.endAt)].filter(Boolean).join(" ~ ")
      : "일정 미정";

    const title = `${ev.roundNo ? `${ev.roundNo} ` : ""}${ev.name}`;

    return res.status(200).json({
      currentEvent: {
        id: ev.id,
        name: title,
        organizer: ev.organizer || "-",
        beginAt: ev.beginAt,
        endAt: ev.endAt,
        schedule,
        mode: ev.mode,
        modeKo: modeKo(ev.mode),
        tier: ev.tier ?? 100,
        tierKo: tierKo(ev.tier ?? 100),
        overview: ev.overview || "",   // 화면 ‘상품/비고’에 사용
        prizes: ev.prizes || "",
        seasonName: ev.season?.name || "",
      },
      // 리더보드는 홈 카드 아래 버튼으로 이동하므로 목록은 비워둠(필요시 다시 계산)
      eventLeaderboard: [],
      seasonLeaderboard: [],
      notices,
    });
  } catch (e) {
    console.error("champ home api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
