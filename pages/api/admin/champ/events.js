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
  const isJSON = (req.headers["content-type"] || "").includes("application/json");
  const pass = isJSON ? req.body?.admin : req.query?.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
}

// 허용 enum 값 가드 (스키마 enum과 맞춰서 대문자 기대)
const ALLOWED = {
  classType: ["OPEN", "AMATEUR", "PRO", "CLUB", "JUNIOR"], // 필요에 맞게 확장
  state: ["OVERVIEW", "READY", "LIVE", "FINISHED", "CANCELLED"],
  mode: ["STROKE", "MATCH", "SCRAMBLE"],
  adjust: ["NONE", "HANDICAP", "DOUBLE_PEORIA", "CALLAWAY"],
};

function normEnum(v, key) {
  if (!v) return undefined;
  const U = String(v).trim().toUpperCase();
  return ALLOWED[key]?.includes(U) ? U : undefined;
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
          beginAt: true,
          endAt: true,
          playedAt: true,
          organizer: true,
          manager: true,
          classType: true,
          state: true,
          mode: true,
          adjust: true,
          overview: true,
          rules: true,
          prizes: true,
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

      const beginAt = toDateOrNull(b.beginAt);
      const endAt = toDateOrNull(b.endAt);
      if (beginAt && endAt && endAt < beginAt) {
        return res.status(400).json({ error: "INVALID_DATE_RANGE" });
      }

      const seasonBase = beginAt || new Date();
      const season = await ensureSeasonForYear(seasonBase.getFullYear());

      const slug = `${slugify(title)}-${Date.now()}`;

      // enum 정규화
      const classType = normEnum(b.classType, "classType"); // 없으면 스키마 default(OPEN)
      const state = normEnum(b.state, "state");             // 없으면 default(OVERVIEW)
      const mode = normEnum(b.mode, "mode");                // 없으면 default(STROKE)
      const adjust = normEnum(b.adjust, "adjust");          // 없으면 default(NONE)

      const organizer = pickStr(b, "org", "organizer");
      const manager = pickStr(b, "manager");

      // playedAt: 우선순위 입력값 > endAt > beginAt
      const playedAt =
        toDateOrNull(b.playedAt) || endAt || beginAt || null;

      // 표시용 요약 (실제 컬럼 저장과 별개)
      const rulesSummary =
        [
          mode ? `방식:${mode}` : null,
          adjust ? `보정:${adjust}` : null,
          manager ? `담당:${manager}` : null,
          organizer ? `부서:${organizer}` : null,
        ].filter(Boolean).join(" · ") || null;

      const created = await prisma.event.create({
        data: {
          seasonId: season.id,
          name: title,
          slug,
          tier: Number.isFinite(+b.tier) ? +b.tier : 100,
          overview: pickStr(b, "overview", "desc", "description"),
          prizes: pickStr(b, "prizes", "prize"),
          beginAt,
          endAt,
          playedAt,
          organizer: organizer || null,
          manager: manager || null,
          ...(classType ? { classType } : {}),
          ...(state ? { state } : {}),
          ...(mode ? { mode } : {}),
          ...(adjust ? { adjust } : {}),
          rules: rulesSummary,
        },
        select: {
          id: true, name: true, slug: true, tier: true,
          beginAt: true, endAt: true, playedAt: true,
          organizer: true, manager: true,
          classType: true, state: true, mode: true, adjust: true,
          overview: true, rules: true, prizes: true,
          createdAt: true,
          season: { select: { id: true, name: true, year: true, slug: true } },
        },
      });

      return res.status(201).json({ ok: true, item: created });
    }

    if (method === "PUT") {
      const id = Number(b.id);
      if (!id) return res.status(400).json({ error: "MISSING_ID" });

      const patch = {};

      // 제목
      const title = pickStr(b, "title", "name", "eventTitle");
      if (title) patch.name = title;

      // 날짜
      if (b.beginAt !== undefined) patch.beginAt = toDateOrNull(b.beginAt);
      if (b.endAt !== undefined) patch.endAt = toDateOrNull(b.endAt);
      if (b.playedAt !== undefined) patch.playedAt = toDateOrNull(b.playedAt);

      // 숫자
      if (b.tier !== undefined && Number.isFinite(+b.tier)) patch.tier = +b.tier;

      // 텍스트
      if (b.overview !== undefined || b.desc !== undefined || b.description !== undefined)
        patch.overview = pickStr(b, "overview", "desc", "description");
      if (b.prizes !== undefined || b.prize !== undefined)
        patch.prizes = pickStr(b, "prizes", "prize");

      // 실 컬럼: organizer/manager/enum들
      if (b.org !== undefined || b.organizer !== undefined)
        patch.organizer = pickStr(b, "org", "organizer") || null;
      if (b.manager !== undefined)
        patch.manager = pickStr(b, "manager") || null;

      const classType = normEnum(b.classType, "classType");
      const state = normEnum(b.state, "state");
      const mode = normEnum(b.mode, "mode");
      const adjust = normEnum(b.adjust, "adjust");
      if (classType) patch.classType = classType;
      if (state) patch.state = state;
      if (mode) patch.mode = mode;
      if (adjust) patch.adjust = adjust;

      // 요약 rules 갱신 (표시용)
      if (
        b.mode !== undefined ||
        b.adjust !== undefined ||
        b.manager !== undefined ||
        b.org !== undefined ||
        b.organizer !== undefined
      ) {
        const _mode = mode || undefined;
        const _adjust = adjust || undefined;
        const _manager = patch.manager !== undefined ? patch.manager : undefined;
        const _org = patch.organizer !== undefined ? patch.organizer : undefined;

        const rulesSummary =
          [
            _mode ? `방식:${_mode}` : null,
            _adjust ? `보정:${_adjust}` : null,
            _manager ? `담당:${_manager}` : null,
            _org ? `부서:${_org}` : null,
          ].filter(Boolean).join(" · ") || null;

        patch.rules = rulesSummary;
      }

      // 날짜 관계 검증 (있을 때만)
      if (patch.beginAt || patch.endAt) {
        const current = await prisma.event.findUnique({ where: { id }, select: { beginAt: true, endAt: true } });
        const beginAt = patch.beginAt ?? current?.beginAt ?? null;
        const endAt = patch.endAt ?? current?.endAt ?? null;
        if (beginAt && endAt && endAt < beginAt) {
          return res.status(400).json({ error: "INVALID_DATE_RANGE" });
        }
      }

      const updated = await prisma.event.update({
        where: { id },
        data: patch,
        select: {
          id: true, name: true, slug: true, tier: true,
          beginAt: true, endAt: true, playedAt: true,
          organizer: true, manager: true,
          classType: true, state: true, mode: true, adjust: true,
          overview: true, rules: true, prizes: true,
          createdAt: true,
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
