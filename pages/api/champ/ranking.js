// pages/api/champ/ranking.js
import prisma from "../../../lib/prisma";

// 숫자 보정
function toNum(v) {
  if (v === undefined || v === null) return null;
  const n = Number(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
function pick(obj, keys = []) {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim?.() !== "") return v;
  }
  return null;
}

export default async function handler(req, res) {
  try {
    const eventId = Number(req.query.eventId);
    if (!eventId) return res.status(400).json({ error: "MISSING_EVENT_ID" });

    // ① 이벤트 + 시즌
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { season: true },
    });
    if (!event) return res.status(404).json({ error: "EVENT_NOT_FOUND" });

    // ② 점수 + 참가자
    const scores = await prisma.score.findMany({
      where: { eventId },
      include: {
        participant: {
          select: {
            id: true,
            name: true,
            type: true, // STAFF | EMPLOYEE | FAMILY
          },
        },
      },
      orderBy: [{ net: "asc" }, { strokes: "asc" }],
    });

    // ③ 시즌 평균타수 (등록자만)
    const regs = await prisma.registration.findMany({
      where: { seasonId: event.seasonId },
      select: { participantId: true },
    });
    const pids = regs.map((r) => r.participantId);

    const seasonScores = await prisma.score.findMany({
      where: {
        participantId: { in: pids.length ? pids : [-1] },
        event: { seasonId: event.seasonId },
        strokes: { not: null },
      },
      select: { participantId: true, strokes: true },
    });

    const sumCnt = new Map(); // pid -> {sum, cnt}
    for (const s of seasonScores) {
      const cur = sumCnt.get(s.participantId) || { sum: 0, cnt: 0 };
      cur.sum += s.strokes;
      cur.cnt += 1;
      sumCnt.set(s.participantId, cur);
    }
    const avgByPid = {};
    for (const [pid, v] of sumCnt.entries()) {
      avgByPid[pid] = (v.sum / v.cnt).toFixed(1);
    }

    // ④ 행 조립 (gender/grade는 rawJson에서 시도)
    const items = scores.map((s, i) => {
      const r = s.rawJson || {};

      // ✅ 핵심: 엑셀 원본(rawJson) 값을 최우선으로 사용하고,
      // rawJson에 없을 때만 DB 컬럼을 fallback.
      const rawStrokes = toNum(
        pick(r, ["합계", "그로스", "타수", "score", "total", "타수(실제)", "실제타수", "GROSS"])
      );
      const rawNet = toNum(
        pick(r, ["넷", "net", "타수(보정)", "보정타수", "NET", "net score", "net-score", "핸디적용"])
      );

      let strokes = rawStrokes ?? s.strokes ?? null;
      let net = rawNet ?? s.net ?? null;

      // rawStrokes가 없고 out/in으로 합산 가능한 경우만 strokes 계산
      if (rawStrokes == null && strokes == null) {
        const out = toNum(pick(r, ["out", "전반", "OUT", "전반타수"]));
        const inn = toNum(pick(r, ["in", "후반", "IN", "후반타수"]));
        if (out != null && inn != null) strokes = out + inn;
      }

      const points =
        s.points ??
        toNum(
          pick(r, ["포인트", "points", "stableford", "스테이블포드", "연간P", "연간포인트", "point", "POINTS"])
        ) ??
        0;

      // 성별 / 등급 추정
      const gender =
        pick(r, ["성별", "gender", "sex"]) ??
        (r["남"] !== undefined ? "남" : r["여"] !== undefined ? "여" : null);
      const grade = pick(r, ["등급", "grade", "class", "level"]);

      // 구분(참가자 타입)
      const type =
        s.participant?.type === "FAMILY"
          ? "가족"
          : s.participant?.type === "STAFF" || s.participant?.type === "EMPLOYEE"
          ? "직원"
          : "—";

      return {
        rank: i + 1,
        realName: s.participant?.name || "—",
        nickname: s.externalNickname,
        gender: gender || "—",
        type,
        grade: grade || "—",
        strokes,
        net,
        points,
        avgStroke: s.participantId ? avgByPid[s.participantId] || "—" : "—",
      };
    });

    const total = items.length;
    const regCount = items.filter((x) => x.realName !== "—").length;
    const unregCount = total - regCount;

    res.status(200).json({
      ok: true,
      season: { year: event.season.year },
      event: { id: event.id, name: event.name },
      stats: { total, regCount, unregCount },
      items,
    });
  } catch (e) {
    console.error("ranking error:", e);
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
}
