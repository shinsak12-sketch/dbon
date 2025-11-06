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

// 🔢 기본 포인트 규칙 (관리자 화면과 동일한 기본값)
const DEFAULT_POINT_RULES = {
  // 순위 1~10 기본 점수
  base: [30, 20, 15, 12, 10, 8, 6, 4, 2, 1],
  // 티어 보정(퍼센트 개념: 120 = 120%, 100 = 100%, 80 = 80%)
  tier: { 120: 120, 100: 100, 80: 80 },
};

function calcPoints(rank, tier) {
  if (!rank || rank < 1) return 0;
  const base = DEFAULT_POINT_RULES.base[rank - 1] || 0;
  const t = DEFAULT_POINT_RULES.tier[tier] || 100;
  // 30점 * 120 / 100 = 36 이런 식
  return Math.round((base * t) / 100);
}

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

// 코스 랭킹 시트 후보 이름
const SHEET_NAME_CANDIDATES = ["코스랭킹", "코스 랭킹", "코스 스트로크 랭킹"];

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

    // 🔎 이벤트 정보(티어) 읽기
    const ev = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, tier: true },
    });
    if (!ev) return res.status(404).json({ error: "EVENT_NOT_FOUND" });
    const eventTier = ev.tier || 100;

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

    // 🔥 헤더 기반 파싱: 0행을 헤더로 쓰는 객체 배열
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: true,
    });

    if (!rows.length)
      return res.status(400).json({ error: "NO_DATA_ROWS" });

    if (debug) {
      return res.status(200).json({
        ok: true,
        sheet: sheetName,
        sample: rows.slice(0, 5),
        note:
          "헤더 이름(닉네임/성별/등급/순위/스트로크/최종성적) 기준으로 파싱합니다.",
      });
    }

    // ── 데이터 정규화 ──
    const parsed = [];
    for (const row of rows) {
      const nickname = String(row["닉네임"] || "").trim();
      if (!nickname) continue; // 닉네임 없으면 스킵

      const rank = toNum(row["순위"]);
      const gender = String(row["성별"] || "").trim() || null;
      const grade = String(row["등급"] || "").trim() || null;

      // 이 파일에는 "최종성적"과 "스트로크"에 언더파(-12 등)가 들어 있음
      const strokes =
        toNum(row["최종성적"]) ?? toNum(row["스트로크"]) ?? null;

      // 👉 여기서 순위 + 티어로 포인트 계산
      const points = calcPoints(rank, eventTier);

      parsed.push({
        externalNickname: nickname,
        rankStroke: rank ?? null,
        strokes,
        points,
        net: null,
        gender,
        grade,
        rawJson: row, // 전체를 그대로 보존
      });
    }

    if (!parsed.length)
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

        const existing = await tx.score.findUnique({
          where: {
            eventId_externalNickname: {
              eventId,
              externalNickname: r.externalNickname,
            },
          },
          select: { id: true },
        });

        const data = {
          participantId,
          strokes: r.strokes,
          net: null,
          points: r.points,
          rankStroke: r.rankStroke,
          rawJson: {
            ...r.rawJson,
            성별: r.gender ?? r.rawJson?.성별 ?? null,
            등급: r.grade ?? r.rawJson?.등급 ?? null,
            포인트: r.points ?? r.rawJson?.포인트 ?? null,
          },
          matched: !!participantId,
        };

        if (existing) {
          await tx.score.update({
            where: { id: existing.id },
            data,
          });
          updated++;
        } else {
          await tx.score.create({
            data: {
              eventId,
              externalNickname: r.externalNickname,
              ...data,
            },
          });
          created++;
        }

        if (participantId) matched++;
      }

      return {
        created,
        updated,
        matched,
        total: parsed.length,
      };
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    console.error("events-upload error:", e);
    return res
      .status(e.status || 500)
      .json({ error: "SERVER_ERROR", message: e.message });
  }
}
