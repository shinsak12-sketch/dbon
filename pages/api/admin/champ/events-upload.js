// pages/api/admin/champ/events-upload.js
import prisma from "../../../../lib/prisma";
import formidable from "formidable";
import * as XLSX from "xlsx";
import os from "os";
import path from "path";
import fs from "fs";

export const config = {
  api: { bodyParser: false, sizeLimit: "20mb" },
};

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

/* ── 1) 라벨 사전: 국문/영문/변형 모두 커버 ─────────────────────────── */
const H = {
  rank:   ["순위","rank","랭킹"],
  name:   ["참가자","닉네임","name","nickname","이름","player","선수","ID","아이디"],
  dept:   ["부서","dept","department","소속"],
  out:    ["out","전반","OUT","전반타수"],
  in:     ["in","후반","IN","후반타수"],
  gross:  ["합계","그로스","gross","타수","score","total","타수(실제)","실제타수","GROSS"],
  hcp:    ["핸디","hcp","handicap","HCP"],
  net:    ["넷","net","타수(보정)","보정타수","NET","net score","net-score","핸디적용"],
  points: ["포인트","points","stableford","스테이블포드","연간P","연간포인트","point","POINTS"],
};

const normKey = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[(){}\[\]_.\-•·:]/g, "");

/* ── 2) 숫자 파싱 ───────────────────────────────────────────────── */
const toNum = (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/* ── 3) 시트에서 헤더 행 자동탐지 ───────────────────────────────── */
function detectHeaderRow(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
  // 0~20행 스캔하여 '필수 후보 라벨'이 다수 존재하는 행을 헤더로 판정
  const wanted = [
    ...H.rank, ...H.name, ...H.gross, ...H.net, ...H.points,
    ...H.out, ...H.in, ...H.dept
  ].map(normKey);

  let bestIdx = 0, bestScore = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const cols = rows[i] || [];
    const score = cols.reduce((acc, c) => acc + (wanted.includes(normKey(c)) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return { headerRow: bestIdx, headerScore: bestScore, headerPreview: rows[bestIdx] || [] };
}

/* ── 4) 한 행 정규화 ────────────────────────────────────────────── */
function normalizeRow(obj) {
  // 키를 소문자/무공백/기호삭제로 맵
  const lower = {};
  Object.keys(obj || {}).forEach((k) => (lower[normKey(k)] = obj[k]));

  const pick = (keys) => {
    for (const lab of keys) {
      const v = lower[normKey(lab)];
      if (v !== undefined && v !== null && String(v).trim?.() !== "") return v;
    }
    return undefined;
  };

  const name = String(pick(H.name) ?? "").trim();
  const dept = String(pick(H.dept) ?? "").trim() || null;

  const out = toNum(pick(H.out));
  const inn = toNum(pick(H.in));

  let gross = toNum(pick(H.gross));
  if (gross == null && out != null && inn != null) gross = out + inn;

  const net  = toNum(pick(H.net));
  const pts  = toNum(pick(H.points));
  const rk   = toNum(pick(H.rank));

  return {
    externalNickname: name || null,
    dept,
    out, in: inn,
    strokes: gross ?? null,
    net: net ?? null,
    points: pts ?? null,
    rankStroke: rk ?? null,
    rawJson: obj, // 원본 보존(헤더 원문 포함)
  };
}

/* ── 5) 권한 / 파일 핸들러 ─────────────────────────────────────── */
function assertAdmin(req) {
  const pass = req.headers["x-admin"] || req.query.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED"); err.status = 401; throw err;
  }
}
function pickFirstFile(files) {
  if (!files) return null;
  for (const k of ["file","excel","upload","scores"]) {
    const v = files[k];
    if (v) return Array.isArray(v) ? v[0] : v;
  }
  const any = Object.values(files)[0];
  return Array.isArray(any) ? any[0] : any || null;
}
const fpp = (f) => f?.filepath || f?.path || f?.tempFilePath || f?.file?.filepath || null;

/* ── 6) 메인 핸들러 ───────────────────────────────────────────── */
export default async function handler(req, res) {
  const debug = req.query.debug === "1";
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow","POST");
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    assertAdmin(req);

    const eventId = Number(req.query.eventId || req.headers["x-event-id"]);
    if (!eventId) return res.status(400).json({ error: "MISSING_EVENT_ID" });

    const uploadDir = path.join(os.tmpdir(), "dbon-uploads");
    try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}

    const form = formidable({
      multiples: false, keepExtensions: true, allowEmptyFiles: false,
      uploadDir, maxFileSize: 20 * 1024 * 1024,
    });

    const { fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, fld, fls) => (err ? reject(err) : resolve({ fields: fld, files: fls })))
    );

    const picked = pickFirstFile(files);
    const filepath = fpp(picked);
    if (!filepath) return res.status(400).json({ error: "FILE_REQUIRED" });

    const wb = XLSX.readFile(filepath, { cellDates: true });
    // 데이터 있는 첫 시트 선택
    let sheet = null; let sheetName = null;
    for (const n of wb.SheetNames) {
      const s = wb.Sheets[n];
      const r = XLSX.utils.sheet_to_json(s, { defval: "", raw: true });
      if (r.length) { sheet = s; sheetName = n; break; }
    }
    if (!sheet) return res.status(400).json({ error: "EMPTY_SHEET" });

    // 헤더 자동탐지 → 그 행부터 JSON 변환
    const meta = detectHeaderRow(sheet);
    const rows = XLSX.utils.sheet_to_json(sheet, {
      range: meta.headerRow, // ← 탐지된 헤더부터 읽음
      defval: "", raw: true,
    });

    // 첫 줄이 실제 헤더인 경우를 위해, 만약 첫 행이 전부 문자열이고 두번째부터 데이터면 OK
    // rows[0]가 헤더로 남지 않도록, XLSX가 자동 키 생성한 객체를 normalizeRow에서 처리

    if (debug) {
      return res.status(200).json({
        ok: true,
        stage: "parsed",
        sheetName,
        headerRow: meta.headerRow,
        headerScore: meta.headerScore,
        headerPreview: meta.headerPreview,
        sampleRows: rows.slice(0, 5),
      });
    }

    // 정규화 & 이름 있는 행만
    const parsed = rows.map(normalizeRow).filter(r => r.externalNickname);

    // 참가자 매칭(닉네임 또는 실명)
    const uniqNames = Array.from(new Set(parsed.map(r => String(r.externalNickname).trim())));
    const participants = await prisma.participant.findMany({
      where: { OR: [{ nickname: { in: uniqNames } }, { name: { in: uniqNames } }] },
      select: { id: true, nickname: true, name: true },
    });
    const key = (s) => String(s || "").replace(/\s+/g,"").toLowerCase();
    const mapByNick = new Map(participants.map(p => [key(p.nickname), p.id]));
    const mapByName = new Map(participants.map(p => [key(p.name), p.id]));

    // 트랜잭션 upsert 적재
    const results = await prisma.$transaction(async (tx) => {
      let created = 0, updated = 0, matched = 0;
      for (const r of parsed) {
        const k = key(r.externalNickname);
        const participantId = mapByNick.get(k) || mapByName.get(k) || null;

        await tx.score.upsert({
          where: { eventId_externalNickname: { eventId, externalNickname: r.externalNickname } },
          create: {
            eventId,
            externalNickname: r.externalNickname,
            participantId,
            strokes: r.strokes,
            net: r.net,
            points: r.points,
            rankStroke: r.rankStroke,
            rawJson: r.rawJson,
            matched: !!participantId,
          },
          update: {
            participantId,
            strokes: r.strokes,
            net: r.net,
            points: r.points,
            rankStroke: r.rankStroke,
            rawJson: r.rawJson,
            matched: !!participantId,
          },
        });

        if (participantId) matched++;
        // upsert 결과 통계 (created/updated 구분 위해 한번 조회)
        // 가벼운 방법: 업데이트 시에도 created++ 안 하도록 별도 체크
        // 여기선 간단히: 기존 존재 여부 체크
        // 성능상 이중 쿼리 피하고 싶으면 created/updated 합계만 써도 됨
        // (필요시 findUnique 후 분기 로직으로 교체 가능)
      }
      // created/updated는 간단히 total로 반환
      return { created: parsed.length, updated: 0, matched, total: parsed.length };
    });

    return res.status(200).json({ ok: true, ...results });
  } catch (e) {
    console.error("events-upload error:", e);
    return res.status(e.status || 500).json({ error: "SERVER_ERROR", message: e.message });
  }
}
