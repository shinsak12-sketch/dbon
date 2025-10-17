// pages/api/admin/champ/events.js
import prisma from "../../../../lib/prisma";

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";
const t = (s) => String(s ?? "").trim();
const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
};

const CLASS_KO2EN = {
  "오픈": "OPEN",
  "클래식": "CLASSIC",
  "인비테이셔널": "INVITATIONAL",
  "챔피언십": "CHAMPIONSHIP",
  "마스터스": "MASTERS",
  "챌린지": "CHALLENGE",
  "플레이오프": "PLAYOFF",
};
const MODE_KO2EN = { "스트로크": "STROKE", "포썸": "FOURSOME" };
const STATE_KO2EN = { "개요": "OVERVIEW", "오픈": "OPEN", "중지": "HOLD", "종료": "FINISH", "결과": "RESULT" };
const ADJUST_KO2EN = { "적용": "APPLY", "미적용": "NONE" };

function assertAdmin(req) {
  const isJSON = (req.headers["content-type"] || "").includes("application/json");
  const pass = isJSON ? req.body?.admin : req.query?.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
}

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === "GET") {
      const items = await prisma.event.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 100,
        select: {
          id: true, name: true, slug: true, tier: true,
          beginAt: true, endAt: true, organizer: true,
          classType: true, state: true, mode: true, adjust: true,
          overview: true, prizes: true, roundNo: true,
          season: { select: { id: true, name: true, year: true, slug: true } },
        },
      });
      return res.status(200).json({ items });
    }

    if (method === "POST") {
      assertAdmin(req);
      const b = req.body || {};
      const title = t(b.name || b.title || b.eventTitle);
      if (!title) return res.status(400).json({ error: "TITLE_REQUIRED" });

      // 시즌 (올해)
      const year = new Date().getFullYear();
      const seasonSlug = String(year);
      let season = await prisma.season.findUnique({ where: { slug: seasonSlug } });
      if (!season) {
        season = await prisma.season.create({ data: { name: `${year} Season`, year, slug: seasonSlug, status: "open" } });
      }

      const created = await prisma.event.create({
        data: {
          seasonId: season.id,
          name: title,
          roundNo: t(b.roundNo) || null,
          organizer: t(b.organizer) || null,
          manager: t(b.manager) || null,
          beginAt: toDate(b.beginAt),
          endAt: toDate(b.endAt),
          classType: CLASS_KO2EN[b.classType] || "OPEN",
          state: STATE_KO2EN[b.state] || "OVERVIEW",
          mode: MODE_KO2EN[b.mode] || "STROKE",
          adjust: ADJUST_KO2EN[b.adjust] || "NONE",
          tier: Number.isFinite(+b.tier) ? +b.tier : 100,
          overview: t(b.overview) || null,
          prizes: t(b.prizes || b.prize) || null,
          // slug는 굳이 안 쓰면 빼도 됨(현재 페이지 경로에서 사용 안 함)
        },
        select: { id: true },
      });
      return res.status(201).json({ ok: true, item: created });
    }

    if (method === "PUT") {
      assertAdmin(req);
      const b = req.body || {};
      const id = Number(b.id);
      if (!id) return res.status(400).json({ error: "MISSING_ID" });

      const patch = {};
      if (b.name !== undefined || b.title !== undefined || b.eventTitle !== undefined)
        patch.name = t(b.name || b.title || b.eventTitle);

      if (b.roundNo !== undefined) patch.roundNo = t(b.roundNo) || null;
      if (b.organizer !== undefined) patch.organizer = t(b.organizer) || null;
      if (b.manager !== undefined) patch.manager = t(b.manager) || null;
      if (b.beginAt !== undefined) patch.beginAt = toDate(b.beginAt);
      if (b.endAt !== undefined) patch.endAt = toDate(b.endAt);
      if (b.classType !== undefined) patch.classType = CLASS_KO2EN[b.classType] || "OPEN";
      if (b.state !== undefined) patch.state = STATE_KO2EN[b.state] || "OVERVIEW";
      if (b.mode !== undefined) patch.mode = MODE_KO2EN[b.mode] || "STROKE";
      if (b.adjust !== undefined) patch.adjust = ADJUST_KO2EN[b.adjust] || "NONE";
      if (b.tier !== undefined && Number.isFinite(+b.tier)) patch.tier = +b.tier;
      if (b.overview !== undefined) patch.overview = t(b.overview) || null;
      if (b.prizes !== undefined || b.prize !== undefined) patch.prizes = t(b.prizes || b.prize) || null;

      const updated = await prisma.event.update({ where: { id }, data: patch, select: { id: true } });
      return res.status(200).json({ ok: true, item: updated });
    }

    if (method === "DELETE") {
      assertAdmin(req);
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: "MISSING_ID" });
      await prisma.score.deleteMany({ where: { eventId: id } });
      await prisma.event.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("admin/champ/events error:", e);
    const isProd = process.env.NODE_ENV === "production";
    return res.status(e.status || 500).json(isProd ? { error: "SERVER_ERROR" } : { error: "SERVER_ERROR", message: e.message });
  }
}
