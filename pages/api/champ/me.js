// pages/api/champ/me.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

const ERR = {
  NEED_NAME_PW: "NAME_AND_PASSWORD_REQUIRED",
  NOT_FOUND: "PARTICIPANT_NOT_FOUND",
  NEED_NICK: "AMBIGUOUS_NAME_NEED_NICKNAME", // ✅ 프론트와 합치기
  NO_PW: "NO_PASSWORD_SET",
  WRONG_PW: "WRONG_PASSWORD",
  METHOD: "METHOD_NOT_ALLOWED",
  SERVER: "SERVER_ERROR",
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    // 로그인
    try {
      const { name, password, nickname } = req.body || {};
      if (!name || !password) {
        return res.status(400).json({ error: ERR.NEED_NAME_PW });
      }

      const people = await prisma.participant.findMany({
        where: { name: String(name).trim() },
      });

      if (people.length === 0) {
        return res.status(404).json({ error: ERR.NOT_FOUND });
      }

      let p = people[0];
      if (people.length > 1) {
        if (!nickname) {
          return res.status(400).json({ error: ERR.NEED_NICK }); // ✅ 통일
        }
        p = people.find(
          (x) => (x.nickname || "").trim() === String(nickname).trim()
        );
        if (!p) return res.status(404).json({ error: ERR.NOT_FOUND });
      }

      if (!p.passhash) return res.status(400).json({ error: ERR.NO_PW });

      const ok = await bcrypt.compare(String(password), p.passhash);
      if (!ok) return res.status(401).json({ error: ERR.WRONG_PW });

      const scores = await prisma.score.findMany({
        where: { participantId: p.id },
        include: { event: { include: { season: true } } },
        orderBy: [{ createdAt: "desc" }],
      });

      return res.status(200).json({
        ok: true,
        me: {
          id: p.id,
          name: p.name,
          dept: p.dept,
          nickname: p.nickname,
          handicap: p.handicap,
        },
        scores,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: ERR.SERVER });
    }
  }

  if (req.method === "PUT") {
    // 내정보 수정(닉/소속/핸디, 새 비번)
    try {
      const {
        name,
        password,
        matchNickname, // ✅ 동명이인 매칭용 "현재 닉네임"
        nickname,      // ✅ 바꿀 "새 닉네임"
        dept,
        handicap,
        newPassword,
      } = req.body || {};

      if (!name || !password) {
        return res.status(400).json({ error: ERR.NEED_NAME_PW });
      }

      const people = await prisma.participant.findMany({
        where: { name: String(name).trim() },
      });
      if (people.length === 0) {
        return res.status(404).json({ error: ERR.NOT_FOUND });
      }

      let p = people[0];
      if (people.length > 1) {
        // ✅ 동명이인이면 매칭용 닉 필요
        if (!matchNickname) {
          return res.status(400).json({ error: ERR.NEED_NICK });
        }
        p = people.find(
          (x) => (x.nickname || "").trim() === String(matchNickname).trim()
        );
        if (!p) return res.status(404).json({ error: ERR.NOT_FOUND });
      }

      if (!p.passhash) return res.status(400).json({ error: ERR.NO_PW });

      const ok = await bcrypt.compare(String(password), p.passhash);
      if (!ok) return res.status(401).json({ error: ERR.WRONG_PW });

      const data = {
        // 값이 주어졌을 때만 업데이트
        ...(typeof dept === "string" ? { dept } : {}),
        ...(typeof nickname === "string" ? { nickname } : {}),
      };

      if (handicap !== undefined && String(handicap).trim() !== "") {
        const h = Number(handicap);
        if (!Number.isNaN(h)) data.handicap = h;
      }

      if (newPassword && String(newPassword).trim() !== "") {
        data.passhash = await bcrypt.hash(String(newPassword), 10);
      }

      const updated = await prisma.participant.update({
        where: { id: p.id },
        data,
      });

      return res.status(200).json({
        ok: true,
        me: {
          id: updated.id,
          name: updated.name,
          dept: updated.dept,
          nickname: updated.nickname,
          handicap: updated.handicap,
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: ERR.SERVER });
    }
  }

  res.setHeader("Allow", ["POST", "PUT"]);
  return res.status(405).json({ error: ERR.METHOD });
}
