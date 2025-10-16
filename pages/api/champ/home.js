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
  return `${y}.${m}.${dd}`;
}
function fmtRange(startISO, endISO) {
  const s = fmtDate(startISO);
  const e = fmtDate(endISO);
  if (s && e && s !== e) return `${s} ~ ${e}`;
  return s || e || "일정 미정";
}
const tierName = (t) => (t >= 120 ? "메이저" : t <= 80 ? "라이트" : "스탠다드");

/* rules 파싱 */
function pickFromRules(rules = "", key) {
  const re = new RegExp(`${key}\\s*:\\s*([^·]+)`);
  const m = (rules || "").match(re);
  return m ? m[1].trim() : "";
}

/* ---------- handler ---------- */
export default async function handler(req, res) {
  try {
    // 공지사항
    const notices = await prisma.notice.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, title: true, createdAt: true, content: true, pinned: true },
    });

    // 가장 최신 이벤트
    const now = new Date();
    const event =
      (await prisma.event.findFirst({
        where: { playedAt: { gte: now } },
        orderBy: { playedAt: "asc" },
        include: { season: true },
      })) ||
      (await prisma.event.findFirst({
        orderBy: { createdAt: "desc" },
        include: { season: true },
      }));

    if (!event) {
      return res.status(200).json({
        ok: true,
        currentEvent: null,
        notices,
      });
    }

    const organizer = pickFromRules(event.rules, "부서") || event.organizer || "";
    const mode = pickFromRules(event.rules, "방식") || event.mode || "";
    const adjust = pickFromRules(event.rules, "보정") || event.adjust || "";

    return res.status(200).json({
      ok: true,
      currentEvent: {
        id: event.id,
        name: event.name,
        roundNo: event.roundNo || null, // ✅ 회차 표시용
        organizer,                      // ✅ 주관부서
        scheduleText: fmtRange(event.beginAt || event.playedAt, event.endAt),
        mode,
        adjust,
        tier: event.tier ?? 100,
        tierName: tierName(event.tier ?? 100),
        prizes: event.prizes || "",     // ✅ 상품/비고
      },
      notices,
    });
  } catch (e) {
    console.error("home api error", e);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
}
