import prisma from "../../../lib/prisma";
import * as XLSX from "xlsx";

/** 간단 포인트 규칙 예시(원하면 서버에서 테이블 참조로 교체) */
function pointsByRank(rank) {
  const table = [50, 40, 35, 30, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 7, 6, 5, 4, 3, 2];
  return table[rank - 1] ?? 1;
}

export const config = { api: { bodyParser: { sizeLimit: "10mb" } } }; // base64 업로드 대비

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { eventId, fileBase64 } = req.body || {};
    if (!eventId || !fileBase64) return res.status(400).json({ error: "REQUIRED_MISSING" });

    // base64 → workbook
    const b64 = fileBase64.replace(/^data:.*;base64,/, "");
    const buf = Buffer.from(b64, "base64");
    const wb = XLSX.read(buf, { type: "buffer" });

    // 첫 시트 가정
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    /** 컬럼 추정: '닉네임' | '별명' and '스트로크' | '타수' | '스코어' */
    const mapped = rows
      .map((r) => {
        const nickname = String(r["닉네임"] || r["별명"] || r["NICKNAME"] || "").trim();
        const strokesRaw = r["타수"] ?? r["스트로크"] ?? r["스코어"] ?? r["STROKE"];
        const strokes = strokesRaw === "" ? null : Number(strokesRaw);
        return nickname && Number.isFinite(strokes) ? { nickname, strokes, raw: r } : null;
      })
      .filter(Boolean);

    if (mapped.length === 0) return res.status(400).json({ error: "NO_VALID_ROWS" });

    // 닉네임 매칭 → 참가자만
    const nicknames = [...new Set(mapped.map((m) => m.nickname))];
    const participants = await prisma.participant.findMany({
      where: { nickname: { in: nicknames } },
      select: { id: true, nickname: true },
    });
    const pmap = new Map(participants.map((p) => [p.nickname, p.id]));

    const validRows = mapped
      .filter((m) => pmap.has(m.nickname))
      .map((m) => ({ participantId: pmap.get(m.nickname), strokes: m.strokes, raw: m.raw }));

    if (validRows.length === 0) {
      return res.status(200).json({ ok: true, saved: 0, skipped: mapped.length });
    }

    // 라운드 내 순위 산정(타수 오름차순)
    const ranked = [...validRows]
      .sort((a, b) => a.strokes - b.strokes)
      .map((r, idx) => ({ ...r, rank: idx + 1, points: pointsByRank(idx + 1) }));

    // upsert 저장
    for (const row of ranked) {
      await prisma.score.upsert({
        where: {
          eventId_participantId: { eventId: Number(eventId), participantId: row.participantId },
        },
        update: { strokes: row.strokes, points: row.points, rawJson: row.raw },
        create: {
          eventId: Number(eventId),
          participantId: row.participantId,
          strokes: row.strokes,
          points: row.points,
          rawJson: row.raw,
        },
      });
    }

    return res.status(200).json({ ok: true, saved: ranked.length, skipped: mapped.length - ranked.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
