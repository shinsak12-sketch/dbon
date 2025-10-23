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

/* ──────────────────────────────────────────────────────────────
 * 1) 이 파일 양식 “코스 스트로크 랭킹 2.xlsx” 전용 헤더 사전
 *    (동의어/대소문자/공백/괄호/기호 모두 정규화하여 매칭)
 * ────────────────────────────────────────────────────────────── */
const H = {
  rank:   ["순위","rank","랭킹"],
  name:   ["닉네임","name","nickname","참가자","선수","아이디","id","player"],
  gender: ["성별","gender","sex"],
  type:   ["구분","구분(직원/가족)","구분(직원)", "구분(가족)","type","category"],
  grade:  ["등급","grade","class","level"],
  out:    ["전반","out","OUT","전반타수"],
  in:     ["후반","in","IN","후반타수"],
  gross:  ["그로스","합계","gross","GROSS","총타","총타수","실타수","스코어","score","total","total score","타수(실제)","실제타수","그로스스코어"],
  hcp:    ["핸디","hcp","handicap","HCP"],
  net:    ["보정","넷","net","NET","보정타수","타수(보정)","net score","net-score","핸디적용"],
  points: ["포인트","points","point","POINTS","stableford","스테이블포드","연간P","연간포인트"],
};

/* 키 정규화: 소문자 + 공백/괄호/기호 제거 */
const normKey = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[(){}\[\]_.\-•·:]/g, "");

/* 숫자 파싱(“74타”, “68 (NET)” 등도 커버) */
const toNum = (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/* 동의어 배열에서 해당 값 찾기 */
function pickLower(lower, keys) {
  for (const lab of keys) {
    const v = lower[normKey(lab)];
    if (v !== undefined && v !== null && String(v).trim?.() !== "") return v;
  }
  return undefined;
}

/* 헤더 행 자동탐지(상단 안내행/공백 있어도 OK) */
function detectHeaderRow(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
  const wanted = [
    ...H.name, ...H.gross, ...H.net, ...H.points, ...H.out, ...H.in,
    ...H.gender, ...H.type, ...H.grade,
  ].map(normKey);

  let bestIdx = 0, bestScore = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const cols = rows[i] || [];
    const score = cols.reduce((acc, c) => acc + (wanted.includes(normKey(c)) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return { headerRow: bestIdx, headerScore: bestScore, headerPreview: rows[bestIdx] || [] };
}

/* 한 행 정규화(이 양식 스펙 기준) */
function normalizeRow(obj) {
  const lower = {};
  Object.keys(obj || {}).forEach((k) => (lower[normKey(k)] = obj[k]));

  const externalNickname = String(pickLower(lower, H.name) ?? "").trim();
  if (!externalNickname) return null;

  const gender = pickLower(lower, H.gender);
  const type   = pickLower(lower, H.type);
  const grade  = pickLower(lower, H.grade);

  const out = toNum(pickLower(lower, H.out));
  const inn = toNum(pickLower(lower, H.in));

  let gross = toNum(pickLower(lower, H.gross));
  if (gross == null && out != null && inn != null) gross = out + inn;

  const hcp  = toNum(pickLower(lower, H.hcp));
  const net  = toNum(pickLower(lower, H.net));
  const pts  = toNum(pickLower(lower, H.points));
  const rk   = toNum(pickLower(lower, H.rank));

  return {
    externalNickname,
    gender: gender ?? null,
    type: type ?? null,     // 직원/가족 (표시용, DB엔 저장 안 함)
    grade: grade ?? null,   // 등급 (표시용, DB엔 저장 안 함)
    out, in: inn,
    strokes: gross ?? null,
    hcp: hcp ?? null,
    net: net ?? null,
    points: pts ?? null,
    rankStroke: rk ?? null,
    rawJson: obj,           // 원본 보존 (순위 화면에서 gender/grade를 이 rawJson에서 꺼내 쓸 것)
  };
}

/* 관리자 인증 */
function assertAdmin(req) {
  const pass = req.headers["x-admin"] || req.query.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED"); err.status = 401; throw err;
  }
}

/* 파일 선택 */
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

/* 메인 핸들러 */
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

    const { files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, _fields, fls) => (err ? reject(err) : resolve({ files: fls })))
    );

    const picked = pickFirstFile(files);
    const filepath = fpp(picked);
    if (!filepath) return res.status(400).json({ error: "FILE_REQUIRED" });

    const wb = XLSX.readFile(filepath, { cellDates: true });
    // 첫 번째 데이터 있는 시트 사용
    let sheet = null; let sheetName = null;
    for (const n of wb.SheetNames) {
      const s = wb.Sheets[n];
      const r = XLSX.utils.sheet_to_json(s, { defval: "", raw: true });
      if (r.length) { sheet = s; sheetName = n; break; }
    }
    if (!sheet) return res.status(400).json({ error: "EMPTY_SHEET" });

    const meta = detectHeaderRow(sheet);
    const rows = XLSX.utils.sheet_to_json(sheet, {
      range: meta.headerRow,
      defval: "",
      raw: true,
    });

    if (debug) {
      return res.status(200).json({
        ok: true, stage: "parsed", sheetName,
        headerRow: meta.headerRow,
        headerPreview: meta.headerPreview,
        sampleRows: rows.slice(0, 5),
      });
    }

    const parsed = rows.map(normalizeRow).filter(Boolean);

    // 참가자 매칭(닉네임 OR 실명 동일표기까지 고려)
    const uniqNames = Array.from(new Set(parsed.map(r => r.externalNickname)));
    const participants = await prisma.participant.findMany({
      where: {
        OR: [
          { nickname: { in: uniqNames } },
          { name:     { in: uniqNames } },
        ],
      },
      select: { id: true, nickname: true, name: true },
    });
    const key = (s) => String(s || "").replace(/\s+/g,"").toLowerCase();
    const byNick = new Map(participants.map(p => [key(p.nickname), p.id]));
    const byName = new Map(participants.map(p => [key(p.name),     p.id]));

    // upsert 적재
    const result = await prisma.$transaction(async (tx) => {
      let created = 0, updated = 0, matched = 0;
      for (const r of parsed) {
        const pid = byNick.get(key(r.externalNickname)) || byName.get(key(r.externalNickname)) || null;

        const up = await tx.score.upsert({
          where: { eventId_externalNickname: { eventId, externalNickname: r.externalNickname } },
          create: {
            eventId,
            externalNickname: r.externalNickname,
            participantId: pid,
            strokes: r.strokes,
            net: r.net,
            points: r.points,
            rankStroke: r.rankStroke,
            rawJson: {
              ...r.rawJson,
              성별: r.gender ?? r.rawJson?.성별 ?? null,
              구분: r.type   ?? r.rawJson?.구분 ?? null,
              등급: r.grade  ?? r.rawJson?.등급 ?? null,
              전반: r.out ?? r.rawJson?.전반 ?? null,
              후반: r.in  ?? r.rawJson?.후반 ?? null,
              그로스: r.strokes ?? r.rawJson?.그로스 ?? null,
              보정: r.net ?? r.rawJson?.보정 ?? null,
              포인트: r.points ?? r.rawJson?.포인트 ?? null,
            },
            matched: !!pid,
          },
          update: {
            participantId: pid,
            strokes: r.strokes,
            net: r.net,
            points: r.points,
            rankStroke: r.rankStroke,
            rawJson: {
              ...r.rawJson,
              성별: r.gender ?? r.rawJson?.성별 ?? null,
              구분: r.type   ?? r.rawJson?.구분 ?? null,
              등급: r.grade  ?? r.rawJson?.등급 ?? null,
              전반: r.out ?? r.rawJson?.전반 ?? null,
              후반: r.in  ?? r.rawJson?.후반 ?? null,
              그로스: r.strokes ?? r.rawJson?.그로스 ?? null,
              보정: r.net ?? r.rawJson?.보정 ?? null,
              포인트: r.points ?? r.rawJson?.포인트 ?? null,
            },
            matched: !!pid,
          },
        });

        if (pid) matched++;
        // created/updated 구분 간단 처리
        if (up && up.createdAt && up.updatedAt && up.createdAt.getTime() === up.updatedAt.getTime()) created++;
        else updated++;
      }
      return { created, updated, matched, total: parsed.length };
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error("events-upload error:", e);
    return res.status(e.status || 500).json({ error: "SERVER_ERROR", message: e.message });
  }
}
