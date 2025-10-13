// pages/api/admin/champ/events.js
import prisma from "../../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

/** ────────────── 유틸 ────────────── **/

// 슬러그 생성
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "event";
}

// 날짜 파서: datetime-local(YYYY-MM-DDTHH:mm)만 신뢰, 그 외는 null
function parseDateSafe(v) {
  if (!v) return null;
  // 브라우저 <input type="datetime-local"> 값이면 공백/초없음 → 그대로 파싱
  // 예: "2025-10-01T09:00"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // 한국식 등 로컬 문자열은 신뢰하지 않고 null 처리
  return null;
}

// 올해 시즌 보장
async function ensureSeasonForYear(year) {
  const slug = String(year);
  let season = await prisma.season.findUnique({ where: { slug } });
  if (!season) {
    season = await prisma.season.create({
      data: { name: `${year} Season`, year, slug, status: "open" },
    });
  }
  return season;
}

// 관리자 인증
function assertAdmin(req) {
  const isJSON = req.headers["content-type"]?.includes("application/json");
  const pass = isJSON ? req.body?.admin : req.query?.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
}

// 상태 매핑 (관리자 한글 → DB 문자열)
const statusMap = {
  "개요": "draft",
  "오픈": "open",
  "중지": "closed",
  "종료": "closed",
  "결과": "published",
};

/** ────────────── 핸들러 ────────────── **/
export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === "GET") {
      const items = await prisma.event.findMany({
        orderBy: [{ createdAt: "desc" }],
        include: { season: true },
        take: 100,
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          playedAt: true,
          createdAt: true,
          season: { select: { id: true, name: true, year: true, slug: true } },
        },
      });
      return res.status(200).json({ items });
    }

    // GET 이외는 관리자 인증
    assertAdmin(req);

    if (method === "POST") {
      const b = req.body || {};
      if (!b.title || !String(b.title).trim()) {
        return res.status(400).json({ error: "TITLE_REQUIRED" });
      }

      // 시즌 확보
      const season = await ensureSeasonForYear(new Date().getFullYear());

      // playedAt: beginAt을 대표일로 저장(없으면 null)
      const playedAt = parseDateSafe(b.beginAt);

      // slug: 안전/유니크
      const base = slugify(b.title);
      const slug = `${base}-${Date.now()}`;

      // 규칙 요약(옵션)
      const rulesSummary = [
        b.mode ? `방식:${b.mode}` : null,
        b.adjust ? `보정:${b.adjust}` : null,
        b.manager ? `담당:${b.manager}` : null,
        b.org ? `부서:${b.org}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || null;

      const created = await prisma.event.create({
        data: {
          seasonId: season.id,
          name: String(b.title),
          slug,
          status: statusMap[b.state] || "draft",
          playedAt,                           // 핵심: 안전 파싱
          overview: b.overview ? String(b.overview) : null,
          rules: rulesSummary,
          prizes: null,
          tier: Number.isFinite(+b.tier) ? +b.tier : 100,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          playedAt: true,
          createdAt: true,
          season: { select: { id: true, name: true, year: true, slug: true } },
        },
      });

      return res.status(201).json({ ok: true, item: created });
    }

    if (method === "PUT") {
      const b = req.body || {};
      const id = Number(b.id);
      if (!id) return res.status(400).json({ error: "MISSING_ID" });

      const data = {
        name: b.title != null ? String(b.title) : undefined,
        status: b.state != null ? (statusMap[b.state] || "draft") : undefined,
        overview: b.overview != null ? String(b.overview) : undefined,
        rules:
          b.mode != null || b.adjust != null || b.manager != null || b.org != null
            ? [
                b.mode ? `방식:${b.mode}` : null,
                b.adjust ? `보정:${b.adjust}` : null,
                b.manager ? `담당:${b.manager}` : null,
                b.org ? `부서:${b.org}` : null,
              ]
                .filter(Boolean)
                .join(" · ") || null
            : undefined,
        prizes: b.prizes != null ? String(b.prizes) : undefined,
        tier:
          b.tier != null && Number.isFinite(+b.tier) ? Number(b.tier) : undefined,
        playedAt:
          b.beginAt !== undefined
            ? parseDateSafe(b.beginAt) // 핵심: 안전 파싱
            : undefined,
      };

      const updated = await prisma.event.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          slug: true,
          tier: true,
          playedAt: true,
          createdAt: true,
          season: { select: { id: true, name: true, year: true, slug: true } },
        },
      });

      return res.status(200).json({ ok: true, item: updated });
    }

    if (method === "DELETE") {
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: "MISSING_ID" });

      await prisma.score.deleteMany({ where: { eventId: id } });
      const deleted = await prisma.event.delete({
        where: { id },
        select: { id: true, name: true, slug: true },
      });

      return res.status(200).json({ ok: true, item: deleted });
    }

    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (err) {
    const status = err?.status || 500;
    console.error("[admin/champ/events] error:", err);
    return res.status(status).json({ error: err?.message || "SERVER_ERROR" });
  }
}
