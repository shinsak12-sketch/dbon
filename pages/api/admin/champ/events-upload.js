// pages/api/admin/champ/events-upload.js
import prisma from "../../../../lib/prisma";
import formidable from "formidable";
import * as XLSX from "xlsx";

export const config = {
  api: { bodyParser: false }, // ✅ multipart 처리
};

const ADMIN_PASS = process.env.ADMIN_PASS || "dbsonsa";

// 헤더 노멀라이즈 (국문/영문 섞여도 처리)
const H = {
  rank:   ["순위","rank","랭킹"],
  name:   ["참가자","이름","name","nickname","닉네임"],
  dept:   ["부서","dept","department"],
  out:    ["out","전반","OUT"],
  in:     ["in","후반","IN"],
  gross:  ["합계","그로스","gross","타수","score"],
  hcp:    ["핸디","hcp","handicap"],
  net:    ["넷","net"],
  points: ["포인트","points","stableford","스테이블포드"],
};

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj[k]; if (v !== undefined && v !== null && String(v).trim?.() !== "") return v;
  }
  return undefined;
}

function normalizeRow(row) {
  // 키 이름을 전부 소문자화
  const lower = {}; Object.keys(row || {}).forEach(k => lower[String(k).toLowerCase().trim()] = row[k]);

  // 매핑
  const get = (k) => pick(lower, H[k].map(x=>x.toLowerCase()));
  const name = String(get("name") ?? "").trim();
  const dept = String(get("dept") ?? "").trim() || null;

  const out = Number(get("out"));
  const _out = Number.isFinite(out) ? out : null;
  const inn = Number(get("in"));
  const _in  = Number.isFinite(inn) ? inn : null;

  const gross = Number(get("gross"));
  const _gross = Number.isFinite(gross) ? gross : (_out!=null && _in!=null ? _out + _in : null);

  const hcp = Number(get("hcp")); const _hcp = Number.isFinite(hcp) ? hcp : null;
  const net = Number(get("net")); const _net = Number.isFinite(net) ? net : null;
  const pts = Number(get("points")); const _pts = Number.isFinite(pts) ? pts : null;

  const rk  = Number(get("rank")); const _rk = Number.isFinite(rk) ? rk : null;

  return {
    externalNickname: name || null,
    dept,
    out: _out, in: _in,
    strokes: _gross,
    net: _net,
    points: _pts,
    rankStroke: _rk, // 필요 시 후처리로 재계산 가능
    rawJson: lower,
  };
}

function assertAdmin(req) {
  const pass = req.headers["x-admin"] || req.query.admin;
  if (pass !== ADMIN_PASS) {
    const err = new Error("UNAUTHORIZED");
    err.status = 401; throw err;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow","POST");
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    assertAdmin(req);
    const eventId = Number(req.query.eventId || req.headers["x-event-id"]);
    if (!eventId) return res.status(400).json({ error: "MISSING_EVENT_ID" });

    // 파일 파싱
    const form = formidable({ multiples: false });
    const { files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }))
    );
    const file = files?.file || files?.excel || Object.values(files || {})[0];
    if (!file?.filepath) return res.status(400).json({ error: "FILE_REQUIRED" });

    const wb = XLSX.readFile(file.filepath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });

    if (!rows.length) return res.status(400).json({ error: "EMPTY_SHEET" });

    // 행 노멀라이즈
    const parsed = rows.map(normalizeRow).filter(r => r.externalNickname);

    // 참가자 매칭 시도 (닉네임 = externalNickname)
    const nicknames = Array.from(new Set(parsed.map(r => r.externalNickname)));
    const participants = await prisma.participant.findMany({
      where: { nickname: { in: nicknames } },
      select: { id: true, nickname: true },
    });
    const nick2id = new Map(participants.map(p => [p.nickname, p.id]));

    // 트랜잭션 적재 (upsert on unique(eventId, externalNickname))
    const results = await prisma.$transaction(async (tx) => {
      let created = 0, updated = 0, matched = 0;

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
          where: { eventId_externalNickname: { eventId, externalNickname: r.externalNickname } },
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
    return res.status(e.status || 500).json({ error: "SERVER_ERROR", message: e.message });
  }
}
