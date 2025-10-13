// pages/api/admin/champ/events.js
import prisma from "../../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

// --- utils -------------------------------------------------
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// 여러 키 중 첫 번째로 채워진 문자열 반환
function pickStr(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return "";
}

// 날짜: ISO만 허용, 아니면 null
function toDateOrNull(v) {
  if (!v) return null;
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return Number.isFinite(d.getTime()) ? d : null;
}

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

function assertAdmin(req) {
  const isJSON = req.headers["content-type"]?.includes("application/json");
  const pass = isJSON ? req.body?.admin : req.query?.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    err.code = 401;
    throw err;
  }
}

// --- handler -----------------------------------------------
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

    // GET 제외하고 인증
    assertAdmin(req);

    // 공통 맵
    const statusMap = {
      "개요": "draft",
      "오픈": "open",
      "중지": "closed",
      "종료": "closed",
      "결과": "published",
    };

    if (method === "POST") {
      const b = req.body || {};

      // ✅ 여러 키 허용: title, name, eventTitle
      const title = pickStr(b, "title", "name", "eventTitle");
      if (!title) return res.status(400).json({ error: "TITLE_REQUIRED" });

      // 시즌 보장(올해)
      const season = await ensureSeasonForYear(new Date().getFullYear());

      const status = statusMap[b.state] || "draft";
      const rulesSummary =
        [
          b.mode ? `방식:${b.mode}` : null,
          b.adjust ? `보정:${b.adjust}` : null,
          b.manager ? `담당:${b.manager}` : null,
          b.org ? `부서:${b.org}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || null;

      const slug = `${slugify(title)}-${Date.now()}`;
      const playedAt = toDateOrNull(b.beginAt); // invalid면 null

      const created = await prisma.event.create({
        data: {
          seasonId: season.id,
          name: title,
          slug,
          status,
          playedAt,
          overview: pickStr(b, "overview", "desc", "description"),
          rules: rulesSummary,
          prizes: pickStr(b, "prizes", "prize"),
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

      const patch = {};
      const title = pickStr(b, "title", "name", "eventTitle");
      if (title) patch.name = title;

      if (b.state !== undefined) patch.status = statusMap[b.state] || "draft";
      if (b.beginAt !== undefined) patch.playedAt = toDateOrNull(b.beginAt);
      if (b.overview !== undefined || b.desc !== undefined || b.description !== undefined)
        patch.overview = pickStr(b, "overview", "desc", "description");
      if (b.prizes !== undefined || b.prize !== undefined)
        patch.prizes = pickStr(b, "prizes", "prize");
      if (b.mode !== undefined || b.adjust !== undefined || b.manager !== undefined || b.org !== undefined) {
        patch.rules = [
          b.mode ? `방식:${b.mode}` : null,
          b.adjust ? `보정:${b.adjust}` : null,
          b.manager ? `담당:${b.manager}` : null,
          b.org ? `부서:${b.org}` : null,
        ].filter(Boolean).join(" · ") || null;
      }
      if (b.tier !== undefined && Number.isFinite(+b.tier)) patch.tier = +b.tier;

      const updated = await prisma.event.update({
        where: { id },
        data: patch,
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
