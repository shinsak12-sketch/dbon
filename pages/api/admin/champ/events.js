// pages/api/admin/champ/events.js
import prisma from "../../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

// (1) 유틸: slug 생성
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// (2) 유틸: Season 보장 (올해 기준)
async function ensureSeasonForYear(year) {
  const slug = String(year);
  let season = await prisma.season.findUnique({ where: { slug } });
  if (!season) {
    season = await prisma.season.create({
      data: {
        name: `${year} Season`,
        year,
        slug,
        status: "open",
      },
    });
  }
  return season;
}

// (3) 관리자 인증
function assertAdmin(req) {
  const isJSON = req.headers["content-type"]?.includes("application/json");
  const pass = isJSON ? req.body?.admin : req.query?.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    err.code = 401;
    throw err;
  }
}

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === "GET") {
      // 리스트
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

    // GET 이외 인증
    assertAdmin(req);

    if (method === "POST") {
      const b = req.body || {};

      // 시즌(올해) 자동 연결
      const now = new Date();
      const season = await ensureSeasonForYear(now.getFullYear());

      // slug 유니크 생성
      const baseSlug = slugify(b.title || "event");
      const slug = `${baseSlug}-${Date.now()}`;

      // 상태 매핑 (관리자 폼의 한글 → DB 문자열)
      const statusMap = {
        "개요": "draft",
        "오픈": "open",
        "중지": "closed",
        "종료": "closed",
        "결과": "published",
      };
      const status = statusMap[b.state] || "draft";

      // 규칙/요약 텍스트에 폼의 확장필드 섞어서 저장
      const rulesSummary = [
        b.mode ? `방식:${b.mode}` : null,
        b.adjust ? `보정:${b.adjust}` : null,
        b.manager ? `담당:${b.manager}` : null,
        b.org ? `부서:${b.org}` : null,
      ].filter(Boolean).join(" · ");

      const created = await prisma.event.create({
        data: {
          seasonId: season.id,
          name: String(b.title || "제목없음"),
          slug,
          status,
          // playedAt: 스키마에 begin/end가 없으므로 beginAt을 대표일로 사용
          playedAt: b.beginAt ? new Date(b.beginAt) : null,
          overview: String(b.overview || ""),
          rules: rulesSummary || null,
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

      // 상태 매핑
      const statusMap = {
        "개요": "draft",
        "오픈": "open",
        "중지": "closed",
        "종료": "closed",
        "결과": "published",
      };
      const status =
        b.state != null ? (statusMap[b.state] || "draft") : undefined;

      // 규칙 요약 재생성(있는 값만 덮어씀)
      const rulesSummary =
        b.mode || b.adjust || b.manager || b.org
          ? [
              b.mode ? `방식:${b.mode}` : null,
              b.adjust ? `보정:${b.adjust}` : null,
              b.manager ? `담당:${b.manager}` : null,
              b.org ? `부서:${b.org}` : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : undefined;

      const updated = await prisma.event.update({
        where: { id },
        data: {
          name: b.title != null ? String(b.title) : undefined,
          // slug는 보통 바꾸지 않음. 필요하면 아래 주석 해제
          // slug: b.slug ? slugify(b.slug) : undefined,
          status,
          playedAt:
            b.beginAt != null
              ? b.beginAt
                ? new Date(b.beginAt)
                : null
              : undefined,
          overview: b.overview != null ? String(b.overview) : undefined,
          rules: rulesSummary,
          prizes: b.prizes != null ? String(b.prizes) : undefined,
          tier:
            b.tier != null && Number.isFinite(+b.tier) ? Number(b.tier) : undefined,
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

      return res.status(200).json({ ok: true, item: updated });
    }

    if (method === "DELETE") {
      const { id } = req.body || {};
      const eid = Number(id);
      if (!eid) return res.status(400).json({ error: "MISSING_ID" });

      // 점수 연관 삭제(관계 onDelete: Cascade면 생략 가능)
      await prisma.score.deleteMany({ where: { eventId: eid } });
      const deleted = await prisma.event.delete({
        where: { id: eid },
        select: { id: true, name: true, slug: true },
      });

      return res.status(200).json({ ok: true, item: deleted });
    }

    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    const code = e?.code === 401 ? 401 : 500;
    if (code === 401) return res.status(401).json({ error: "UNAUTHORIZED" });
    console.error("admin champ events api error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
