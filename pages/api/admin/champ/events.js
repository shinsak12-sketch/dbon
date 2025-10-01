// pages/api/admin/champ/events.js
import prisma from "../../../../lib/prisma";

/** 유틸: Setting(key)에서 JSON 불러오기 */
async function loadKV(key, fallback) {
  const s = await prisma.setting.findUnique({ where: { key } });
  if (!s?.value) return fallback;
  try {
    return JSON.parse(s.value);
  } catch {
    return fallback;
  }
}
/** 유틸: Setting(key)에 JSON 저장 */
async function saveKV(key, val) {
  const value = JSON.stringify(val ?? null);
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

const KEY = "champ:events";

/**
 * 이벤트 스키마(Setting에 저장되는 형태)
 * {
 *   id: number,            // Date.now()
 *   roundNo: string,       // 몇회
 *   org: string,           // 주관부서
 *   title: string,         // 대회명
 *   classType: string,     // 오픈|클래식|...
 *   manager: string,       // 부서담당자
 *   beginAt: string,       // ISO(YYYY-MM-DDTHH:mm)
 *   endAt: string,         // ISO
 *   tier: number,          // 120|100|80
 *   state: string,         // 개요|오픈|중지|종료|결과
 *   mode: string,          // 스트로크|포썸
 *   adjust: string,        // 적용|미적용
 *   overview: string,      // 설명
 *   createdAt: string      // ISO
 * }
 */

export default async function handler(req, res) {
  const { method } = req;

  // 간단 관리자 보호
  if (method !== "GET") {
    if (req.headers["content-type"]?.includes("application/json")) {
      const body = req.body ?? {};
      if (body.admin !== "dbsonsa") {
        return res.status(401).json({ error: "UNAUTHORIZED" });
      }
    } else if (req.query.admin !== "dbsonsa") {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }
  }

  try {
    const data = (await loadKV(KEY, [])) || [];

    if (method === "GET") {
      // 최신순 정렬
      const items = [...data].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return res.json({ items });
    }

    if (method === "POST") {
      const b = req.body || {};
      const item = {
        id: Date.now(),
        roundNo: String(b.roundNo || ""),
        org: String(b.org || ""),
        title: String(b.title || ""),
        classType: String(b.classType || "오픈"),
        manager: String(b.manager || ""),
        beginAt: String(b.beginAt || ""),
        endAt: String(b.endAt || ""),
        tier: Number(b.tier ?? 100),
        state: String(b.state || "개요"),
        mode: String(b.mode || "스트로크"),
        adjust: String(b.adjust || "미적용"),
        overview: String(b.overview || ""),
        createdAt: new Date().toISOString(),
      };
      await saveKV(KEY, [item, ...data]);
      return res.status(201).json({ ok: true, item });
    }

    if (method === "PUT") {
      const b = req.body || {};
      if (!b.id) return res.status(400).json({ error: "MISSING_ID" });
      const idx = data.findIndex((x) => x.id === b.id);
      if (idx === -1) return res.status(404).json({ error: "NOT_FOUND" });

      const updated = {
        ...data[idx],
        roundNo: String(b.roundNo ?? data[idx].roundNo),
        org: String(b.org ?? data[idx].org),
        title: String(b.title ?? data[idx].title),
        classType: String(b.classType ?? data[idx].classType),
        manager: String(b.manager ?? data[idx].manager),
        beginAt: String(b.beginAt ?? data[idx].beginAt),
        endAt: String(b.endAt ?? data[idx].endAt),
        tier: Number(b.tier ?? data[idx].tier),
        state: String(b.state ?? data[idx].state),
        mode: String(b.mode ?? data[idx].mode),
        adjust: String(b.adjust ?? data[idx].adjust),
        overview: String(b.overview ?? data[idx].overview),
      };
      const next = [...data];
      next[idx] = updated;
      await saveKV(KEY, next);
      return res.json({ ok: true, item: updated });
    }

    if (method === "DELETE") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: "MISSING_ID" });
      const next = data.filter((x) => x.id !== id);
      await saveKV(KEY, next);
      return res.json({ ok: true });
    }

    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    return res.status(405).end("Method Not Allowed");
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
