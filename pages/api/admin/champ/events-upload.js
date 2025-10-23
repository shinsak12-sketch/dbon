// pages/api/admin/champ/events-upload.js
import prisma from "../../../../lib/prisma";
import formidable from "formidable";
import * as XLSX from "xlsx";

export const config = {
  // ✅ multipart 업로드 + 충분한 용량
  api: { bodyParser: false, sizeLimit: "20mb" },
};

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

/* =========================
 * 헬퍼: 헤더 매핑 / 파싱
 * ========================= */
const H = {
  rank:   ["순위", "rank", "랭킹"],
  name:   ["참가자", "이름", "name", "nickname", "닉네임"],
  dept:   ["부서", "dept", "department"],
  out:    ["out", "전반", "OUT"],
  in:     ["in", "후반", "IN"],
  gross:  ["합계", "그로스", "gross", "타수", "score", "total"],
  hcp:    ["핸디", "hcp", "handicap"],
  net:    ["넷", "net"],
  points: ["포인트", "points", "stableford", "스테이블포드"],
};

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim?.() !== "") return v;
  }
  return undefined;
}

// 행 정규화
function normalizeRow(row) {
  const lower = {};
  Object.keys(row || {}).forEach((k) => {
    lower[String(k).toLowerCase().trim()] = row[k];
  });

  const get = (k) => pick(lower, H[k].map((x) => x.toLowerCase()));

  const name = String(get("name") ?? "").trim();
  const dept = String(get("dept") ?? "").trim() || null;

  const out = Number(get("out"));
  const _out = Number.isFinite(out) ? out : null;

  const inn = Number(get("in"));
  const _in = Number.isFinite(inn) ? inn : null;

  const gross = Number(get("gross"));
  const _gross =
    Number.isFinite(gross) ? gross : _out != null && _in != null ? _out + _in : null;

  const hcp = Number(get("hcp"));
  const _hcp = Number.isFinite(hcp) ? hcp : null; // 현재는 저장 안 함 (필요 시 확장)

  const net = Number(get("net"));
  const _net = Number.isFinite(net) ? net : null;

  const pts = Number(get("points"));
  const _pts = Number.isFinite(pts) ? pts : null;

  const rk = Number(get("rank"));
  const _rk = Number.isFinite(rk) ? rk : null;

  return {
    externalNickname: name || null,
    dept,
    out: _out,
    in: _in,
    strokes: _gross,
    net: _net,
    points: _pts,
    rankStroke: _rk,
    rawJson: lower,
  };
}

/* =========================
 * 헬퍼: 업로드/권한
 * ========================= */
function assertAdmin(req) {
  const pass = req.headers["x-admin"] || req.query.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401;
    throw err;
  }
}

// 다양한 브라우저/런타임에서 파일 객체 뽑기
function pickFirstFile(files) {
  if (!files) return null;
  // 흔한 키들 우선 시도
  const candKeys = ["file", "excel", "upload", "scores"];
  for (const k of candKeys) {
    const v = files[k];
    if (v) return Array.isArray(v) ? v[0] : v;
  }
  // 아무 키나 첫 번째
  const any = Object.values(files)[0];
  return Array.isArray(any) ? any[0] : any || null;
}

// 실제 경로 얻기 (formidable 버전에 따라 다름)
function filePathOf(f) {
  return f?.filepath || f?.path || f?.tempFilePath || f?.file?.filepath || null;
}

/* =========================
 * 메인 핸들러
 * ========================= */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }

    assertAdmin(req);

    const eventId = Number(req.query.eventId || req.headers["x-event-id"]);
    if (!eventId) return res.status(400).json({ error: "MISSING_EVENT_ID" });

    // 업로드 파싱
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      allowEmptyFiles: false,
      maxFileSize: 20 * 1024 * 1024, // 20MB
    });

    const { files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })))
    );

    const picked = pickFirstFile(files);
    const filepath = filePathOf(picked);

    if (!filepath) {
      return res.status(400).json({ error: "FILE_REQUIRED" });
    }

    // Excel/CSV 읽기
    let wb;
    try {
      wb = XLSX.readFile(filepath, { cellDates: true });
    } catch (e) {
      return res.status(400).json({ error: "INVALID_FILE_FORMAT", message: e.message });
    }

    // 첫 번째로 데이터가 있는 시트 선택
    let sheet = null;
    for (const name of wb.SheetNames) {
      const s = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(s, { defval: "", raw: true });
      if (rows.length) {
        sheet = s;
        break;
      }
    }
    if (!sheet) return res.status(400).json({ error: "EMPTY_SHEET" });

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
    if (!rows.length) return res.status(400).json({ error: "EMPTY_SHEET" });

    // 행 정규화
    const parsed = rows.map(normalizeRow).filter((r) => r.externalNickname);

    if (!parsed.length) {
      return res.status(400).json({ error: "NO_VALID_ROWS" });
    }

    // 닉네임 매칭
    const nicknames = Array.from(new Set(parsed.map((r) => r.externalNickname)));
    const participants = await prisma.participant.findMany({
      where: { nickname: { in: nicknames } },
      select: { id: true, nickname: true },
    });
    const nick2id = new Map(participants.map((p) => [p.nickname, p.id]));

    // 트랜잭션 적재
    const results = await prisma.$transaction(async (tx) => {
      let created = 0,
        updated = 0,
        matched = 0;

      for (const r of parsed) {
        const participantId = nick2id.get(r.externalNickname) || null;

        const data = {
          eventId,
          externalNickname: r.externalNickname,
          participantId,
          strokes: r.strokes ?? null,
          net: r.net ?? null,
          points: r.points ?? null,
          rankStroke: r.rankStroke ?? null,
          rawJson: r.rawJson,
          matched: !!participantId,
        };

        // upsert by (eventId, externalNickname)
        const prev = await tx.score.findUnique({
          where: {
            eventId_externalNickname: { eventId, externalNickname: r.externalNickname },
          },
          select: { id: true },
        });

        if (prev) {
          await tx.score.update({ where: { id: prev.id }, data });
          updated++;
        } else {
          await tx.score.create({ data });
          created++;
        }
        if (participantId) matched++;
      }

      return { created, updated, matched, total: parsed.length };
    });

    return res.status(200).json({ ok: true, ...results });
  } catch (e) {
    console.error("events-upload error", e);
    const status = e.status || 500;
    return res.status(status).json({ error: status === 401 ? "UNAUTHORIZED" : "SERVER_ERROR", message: e.message });
  }
}
