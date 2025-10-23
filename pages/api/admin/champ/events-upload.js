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

// 숫자 파싱(문자 안의 숫자만 추출)
function toNum(v) {
  if (v === undefined || v === null) return null;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// 관리자 인증
function assertAdmin(req) {
  const pass = req.headers["x-admin"] || req.query.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
}

// 파일 고르기
function pickFirstFile(files) {
  if (!files) return null;
  for (const k of ["file", "excel", "upload", "scores"]) {
    const v = files[k];
    if (v) return Array.isArray(v) ? v[0] : v;
  }
  const any = Object.values(files)[0];
  return Array.isArray(any) ? any[0] : any || null;
}
const fpp = (f) =>
  f?.filepath || f?.path || f?.tempFilePath || f?.file?.filepath || null;

// 이 파일 양식 고정 매핑 (시트: 코스랭킹, 헤더행: 0)
const SHEET_NAME_CANDIDATES = ["코스랭킹", "코스 랭킹", "코스 스트로크 랭킹"];
const FIXED_MAP = {
  rankCol: 0,      // "순위"
  nickCol: 1,      // "닉네임"
  gradeCol: 7,     // "등급"
  strokesCol: 10,  // "스트로크"  (이 파일에선 -12 같은 값이 들어올 수 있음)
};

export default async function handler(req, res) {
  const debug = req.query.debug === "1";
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    assertAdmin(req);

    const eventId = Number(req.query.eventId || req.headers["x-event-id"]);
    if (!eventId)
      return res.status(400).json({ error: "MISSING_EVENT_ID" });

    // ── 파일 파싱 ──
    const uploadDir = path.join(os.tmpdir(), "dbon-uploads");
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch {}
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      allowEmptyFiles: false,
      uploadDir,
      maxFileSize: 20 * 1024 * 1024,
    });

    const { files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, _fields, fls) =>
        err ? reject(err) : resolve({ files: fls })
      )
    );

    const picked = pickFirstFile(files);
    const filepath = fpp(picked);
    if (!filepath) return res.status(400).json({ error: "FILE_REQUIRED" });

    const wb = XLSX.readFile(filepath, { cellDates: true });
    // 시트 선택: "코스랭킹" 우선, 없으면 첫 데이터 시트
    let sheet = null;
    let sheetName = null;
    for (const name of wb.SheetNames) {
      if (SHEET_NAME_CANDIDATES.includes(name)) {
        sheet = wb.Sheets[name];
        sheetName = name;
        break;
      }
    }
    if (!sheet) {
      for (const n of wb.SheetNames) {
        const s = wb.Sheets[n];
        const r = XLSX.utils.sheet_to_json(s, { header: 1, defval: "" });
        if (r.length > 1) {
          sheet = s;
          sheetName = n;
          break;
        }
      }
    }
    if (!sheet) return res.status(400).json({ error: "EMPTY_SHEET" });

    // 0행 헤더 가정, 1행부터 데이터
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: "",
    });

    if (rows.length <= 1)
      return res.status(400).json({ error: "NO_DATA_ROWS" });

    const header = rows[0];
    const dataRows = rows.slice(1);

    if (debug) {
      return res.status(200).json({
        ok: true,
        sheet: sheetName,
        header,
        sample: dataRows.slice(0, 5),
        note: "이 파일 스펙에 맞춰 (순위, 닉네임, 등급, 스트로크)만 적재합니다.",
      });
    }

    // ── 데이터 정규화 ──
    const parsed = [];
    for (const r of dataRows) {
      const nickname = String(r[FIXED_MAP.nickCol] || "").trim();
      if (!nickname) continue; // 닉네임 없으면 스킵

      const rank = toNum(r[FIXED_MAP.rankCol]);
      const grade = String(r[FIXED_MAP.gradeCol] || "").trim() || null;

      // 이 파일의 "스트로크" 열(10)은 -12 같은 값일 수 있음 (파일 정의대로 그대로 저장)
      const strokes = toNum(r[FIXED_MAP.strokesCol]);

      parsed.push({
        externalNickname: nickname,
        rankStroke: rank ?? null,
        strokes: strokes ?? null,
        net: null,
        points: null,
        rawJson: {
          순위: r[FIXED_MAP.rankCol] ?? null,
          닉네임: r[FIXED_MAP.nickCol] ?? null,
          등급: grade,
          스트로크: r[FIXED_MAP.strokesCol] ?? null,
        },
        grade, // 표시 목적(랭킹 API에서 rawJson과 함께 참고)
      });
    }

    if (parsed.length === 0)
      return res.status(400).json({ error: "NO_VALID_ROWS" });

    // ── 참가자 매칭: 닉네임 기준 ──
    const uniqNames = Array.from(
      new Set(parsed.map((p) => p.externalNickname))
    );
    const participants = await prisma.participant.findMany({
      where: { nickname: { in: uniqNames } },
      select: { id: true, nickname: true },
    });
    const nick2id = new Map(participants.map((p) => [p.nickname, p.id]));

    // ── upsert 저장 ──
    const result = await prisma.$transaction(async (tx) => {
      let created = 0,
        updated = 0,
        matched = 0;

      for (const r of parsed) {
        const participantId = nick2id.get(r.externalNickname) || null;

        const up = await tx.score.upsert({
          where: {
            eventId_externalNickname: {
              eventId,
              externalNickname: r.externalNickname,
            },
          },
          create: {
            eventId,
            externalNickname: r.externalNickname,
            participantId,
            strokes: r.strokes,
            net: r.net,
            points: r.points,
            rankStroke: r.rankStroke,
            rawJson: {
              ...r.rawJson,
              등급: r.grade ?? r.rawJson?.등급 ?? null,
            },
            matched: !!participantId,
          },
          update: {
            participantId,
            strokes: r.strokes,
            net: r.net,
            points: r.points,
            rankStroke: r.rankStroke,
            rawJson: {
              ...r.rawJson,
              등급: r.grade ?? r.rawJson?.등급 ?? null,
            },
            matched: !!participantId,
          },
        });

        if (participantId) matched++;
        // created/updated 구분 (간단히 updatedAt 비교 대신 존재 여부 확인하려면 별도 조회 필요)
        // 여기선 합계만 반환
      }
      return { created: parsed.length, updated: 0, matched, total: parsed.length };
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error("events-upload error:", e);
    return res
      .status(e.status || 500)
      .json({ error: "SERVER_ERROR", message: e.message });
  }
}
