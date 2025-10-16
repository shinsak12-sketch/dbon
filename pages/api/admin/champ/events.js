// pages/api/admin/champ/events.js
import prisma from "../../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

/* utils */
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

function pickStr(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function toDateOrNull(v) {
  if (!v) return null;
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  return Number.isFinite(d.getTime()) ? d : null;
}

async function ensureSeasonForYear(year: number) {
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
  const isJSON = (req.headers["content-type"] || "").includes("application/json");
  const pass = isJSON ? req.body?.admin : req.query?.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    // @ts-ignore
    err.status = 401;
    throw err;
  }
}

/* handler */
export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === "GET") {
      const items = await prisma.event.findMany({
        orderBy: [{ createdAt: "desc" }],
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

    // write ops need admin
    assertAdmin(req);
    const b = req.body || {};

    if (method === "POST") {
      const title = pickStr(b, "title", "name", "eventTitle");
      if (!title) return res.status(400).json({ error: "TITLE_REQUIRED" });

      const season = await ensureSeasonForYear(new Date().getFullYear());
      const slug = `${slugify(title)}-${Date.now()}`;
      const playedAt = toDateOrNull(b.beginAt);

      // 간단 요약을 rules 로 저장(모델에 별도 컬럼이 없어서)
      const rulesSummary =
        [
          b.mode ? `방식:${b.mode}` : null,
          b.adjust ? `보정:${b.adjust}` : null,
          b.manager ? `담당:${b.manager}` : null,
          (b.org || b.organizer) ? `부서:${b.org || b.organizer}` : null,
        ].filter(Boolean).join(" · ") || null;

      const created = await prisma.event.create({
        data: {
          seasonId: season.id,
          name: title,
          slug,
          playedAt,                                 // ✅ 존재하는 컬럼
          tier: Number.isFinite(+b.tier) ? +b.tier : 100,
          overview: pickStr(b, "overview", "desc", "description"),
          rules: rulesSummary,
          prizes: pickStr(b, "prizes", "prize"),
          // ❌ status/state/classType/mode/adjust 등 미존재 컬럼은 쓰지 않음
        },
        select: {
          id: true, name: true, slug: true, tier: true, playedAt: true, createdAt: true,
          season: { select: { id: true, name: true, year: true, slug: true } },
        },
      });

      return res.status(201).json({ ok: true, item: created });
    }

    if (method === "PUT") {
      const id = Number(b.id);
      if (!id) return res.status(400).json({ error: "MISSING_ID" });

      const patch = {};
      const title = pickStr(b, "title", "name", "eventTitle");
      if (title) patch.name = title;
      if (b.beginAt !== undefined) patch.playedAt = toDateOrNull(b.beginAt);
      if (b.tier !== undefined && Number.isFinite(+b.tier)) patch.tier = +b.tier;
      if (b.overview !== undefined || b.desc !== undefined || b.description !== undefined)
        patch.overview = pickStr(b, "overview", "desc", "description");
      if (b.prizes !== undefined || b.prize !== undefined)
        patch.prizes = pickStr(b, "prizes", "prize");
      if (b.mode !== undefined || b.adjust !== undefined || b.manager !== undefined || b.org !== undefined || b.organizer !== undefined) {
        patch.rules = [
          b.mode ? `방식:${b.mode}` : null,
          b.adjust ? `보정:${b.adjust}` : null,
          b.manager ? `담당:${b.manager}` : null,
          (b.org || b.organizer) ? `부서:${b.org || b.organizer}` : null,
        ].filter(Boolean).join(" · ") || null;
      }

      const updated = await prisma.event.update({
        where: { id },
        data: patch,
        select: {
          id: true, name: true, slug: true, tier: true, playedAt: true, createdAt: true,
          season: { select: { id: true, name: true, year: true, slug: true } },
        },
      });

      return res.status(200).json({ ok: true, item: updated });
    }

    if (method === "DELETE") {
      const eid = Number(b.id);
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
    console.error("admin/champ/events error:", e);
    const isProd = process.env.NODE_ENV === "production";
    return res
      .status(e.status || 500)
      .json(isProd ? { error: "SERVER_ERROR" } : { error: "SERVER_ERROR", message: e.message, stack: e.stack });
  }
}
