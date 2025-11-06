// pages/api/champ/season-ranking.js
import prisma from "../../../lib/prisma";

function safeNum(v) {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req, res) {
  try {
    // 1) 시즌 목록 (연도 드롭다운용)
    const seasons = await prisma.season.findMany({
      orderBy: { year: "asc" },
      select: { id: true, year: true },
    });

    if (!seasons.length) {
      return res.status(200).json({
        years: [],
        year: null,
        summary: { totalPlayers: 0, totalRounds: 0, avgRounds: 0, avgPoints: 0 },
        items: [],
      });
    }

    // 2) 조회할 연도 결정 (쿼리 없으면 가장 최근 연도)
    let year = safeNum(req.query.year);
    if (!year) {
      year = seasons[seasons.length - 1].year;
    }

    // 3) 해당 연도 시즌 + 이벤트
    const season = await prisma.season.findFirst({
      where: { year },
      select: {
        id: true,
        year: true,
        events: { select: { id: true } },
      },
    });

    if (!season || !season.events.length) {
      return res.status(200).json({
        years: seasons.map((s) => s.year),
        year,
        summary: { totalPlayers: 0, totalRounds: 0, avgRounds: 0, avgPoints: 0 },
        items: [],
      });
    }

    const eventIds = season.events.map((e) => e.id);

    // 4) 점수 + 참가자 정보 조회
    const scores = await prisma.score.findMany({
      where: { eventId: { in: eventIds } },
      include: {
        participant: true,
      },
    });

    // 5) 참가자/닉네임별 집계
    const map = new Map();

    for (const s of scores) {
      const key = s.participantId ? `p:${s.participantId}` : `x:${s.externalNickname}`;
      const raw = (s.rawJson || {});
      const genderFromRaw = raw["성별"] || raw["gender"] || null;
      const gradeFromRaw = raw["등급"] || raw["grade"] || null;

      let rec = map.get(key);
      if (!rec) {
        rec = {
          key,
          participantId: s.participantId || null,
          externalNickname: s.externalNickname,
          nickname: s.participant?.nickname || s.externalNickname || "-",
          realName: s.participant?.name || null,
          dept: s.participant?.dept || null,
          type: s.participant?.type || null, // EMPLOYEE / FAMILY / STAFF
          gender: genderFromRaw || null,
          grade: gradeFromRaw || null,

          playedCount: 0,
          wins: 0,
          top3: 0,

          totalPoints: 0,
          strokesSum: 0,
          strokesCount: 0,
          netSum: 0,
          netCount: 0,
        };
      }

      const pts = safeNum(s.points) || 0;
      const strokes = safeNum(s.strokes);
      const net = safeNum(s.net);

      rec.playedCount += 1;
      rec.totalPoints += pts;

      if (strokes !== null) {
        rec.strokesSum += strokes;
        rec.strokesCount += 1;
      }
      if (net !== null) {
        rec.netSum += net;
        rec.netCount += 1;
      }

      const rStroke = safeNum(s.rankStroke);
      if (rStroke && rStroke === 1) rec.wins += 1;
      if (rStroke && rStroke <= 3) rec.top3 += 1;

      // 이름/성별/등급은 초기값이 없을 때만 채움
      if (!rec.realName && s.participant?.name) rec.realName = s.participant.name;
      if (!rec.gender && genderFromRaw) rec.gender = genderFromRaw;
      if (!rec.grade && gradeFromRaw) rec.grade = gradeFromRaw;

      map.set(key, rec);
    }

    // 6) 최종 배열로 변환 + 평균 계산
    const items = Array.from(map.values()).map((r) => {
      const avgStrokes =
        r.strokesCount > 0 ? Math.round((r.strokesSum / r.strokesCount) * 10) / 10 : null;
      const avgNet =
        r.netCount > 0 ? Math.round((r.netSum / r.netCount) * 10) / 10 : null;

      return {
        participantId: r.participantId,
        externalNickname: r.externalNickname,
        nickname: r.nickname,
        realName: r.realName,
        dept: r.dept,
        type: r.type,
        gender: r.gender,
        grade: r.grade,

        playedCount: r.playedCount,
        wins: r.wins,
        top3: r.top3,

        totalPoints: r.totalPoints,
        avgStrokes,
        avgNet,
      };
    });

    // 기본 정렬: 포인트 내림차순 → 평균타 오름차순 → 출전수 내림차순
    items.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (a.avgStrokes !== null && b.avgStrokes !== null) {
        if (a.avgStrokes !== b.avgStrokes) return a.avgStrokes - b.avgStrokes;
      }
      return b.playedCount - a.playedCount;
    });

    // 순위 번호 부여
    items.forEach((it, idx) => {
      it.rank = idx + 1;
    });

    // 7) 요약값
    const totalPlayers = items.length;
    const totalRounds = scores.length;
    const avgRounds =
      totalPlayers > 0 ? Math.round((totalRounds / totalPlayers) * 10) / 10 : 0;
    const avgPoints =
      totalPlayers > 0
        ? Math.round(
            (items.reduce((sum, it) => sum + (it.totalPoints || 0), 0) / totalPlayers) * 10
          ) / 10
        : 0;

    return res.status(200).json({
      years: seasons.map((s) => s.year),
      year,
      summary: { totalPlayers, totalRounds, avgRounds, avgPoints },
      items,
    });
  } catch (e) {
    console.error("season-ranking error:", e);
    return res
      .status(500)
      .json({ error: "SERVER_ERROR", message: e.message });
  }
}
