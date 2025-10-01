// pages/api/champ/me.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

const ERR = {
  NEED_NAME_PW: "NAME_AND_PASSWORD_REQUIRED",
  NOT_FOUND: "해당 선수가 등록되어 있지 않습니다. 참가 등록을 먼저 해주세요.",
  NEED_NICK: "AMBIGUOUS_NAME_NEED_NICKNAME",
  NO_PW: "NO_PASSWORD_SET",
  WRONG_PW: "WRONG_PASSWORD",
  METHOD: "METHOD_NOT_ALLOWED",
  SERVER: "SERVER_ERROR",
};

const trim = (s) => String(s ?? "").trim();

export default async function handler(req, res) {
  if (req.method === "POST") {
    // 로그인
    try {
      const name = trim(req.body?.name);
      const password = String(req.body?.password ?? "");
      const nickname = trim(req.body?.nickname);

      if (!name || !password) {
        return res.status(400).json({ error: ERR.NEED_NAME_PW });
      }

      const nameCond = { equals: name, mode: "insensitive" };

      // 닉네임이 오면: 이름+닉 단일 조회
      let p;
      if (nickname) {
        p = await prisma.participant.findFirst({
          where: {
            name: nameCond,
            nickname: { equals: nickname, mode: "insensitive" },
          },
        });
        if (!p) return res.status(404).json({ error: ERR.NOT_FOUND });
      } else {
        // 닉이 없으면: 이름으로 목록 조회 → 동명이인이면 닉 요구
        const people = await prisma.participant.findMany({
          where: { name: nameCond },
        });
        if (people.length === 0)
          return res.status(404).json({ error: ERR.NOT_FOUND });
        if (people.length > 1)
          return res.status(400).json({ error: ERR.NEED_NICK });
        p = people[0];
      }

      // ✅ 필드 통일: passwordHash 사용
      if (!p.passwordHash) {
        return res.status(400).json({ error: ERR.NO_PW });
      }

      const ok = await bcrypt.compare(password, p.passwordHash);
      if (!ok) return res.status(401).json({ error: ERR.WRONG_PW });

      // 기록 로드
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
    // 내정보 수정(닉/소속/핸디, 비번변경)
    try {
      const name = trim(req.body?.name);
      const password = String(req.body?.password ?? "");
      const matchNickname = trim(req.body?.matchNickname); // 동명이인 매칭용(현재 닉)
      const newNickname = req.body?.nickname; // 바꿀 닉
      const dept = req.body?.dept;
      const handicap = req.body?.handicap;
      const newPassword = req.body?.newPassword;

      if (!name || !password) {
        return res.status(400).json({ error: ERR.NEED_NAME_PW });
      }

      const nameCond = { equals: name, mode: "insensitive" };

      // 동명이인이면 matchNickname으로 단일 조회
      let p;
      if (matchNickname) {
        p = await prisma.participant.findFirst({
          where: {
            name: nameCond,
            nickname: { equals: trim(matchNickname), mode: "insensitive" },
          },
        });
        if (!p) return res.status(404).json({ error: ERR.NOT_FOUND });
      } else {
        const people = await prisma.participant.findMany({
          where: { name: nameCond },
        });
        if (people.length === 0)
          return res.status(404).json({ error: ERR.NOT_FOUND });
        if (people.length > 1)
          return res.status(400).json({ error: ERR.NEED_NICK });
        p = people[0];
      }

      // ✅ 필드 통일
      if (!p.passwordHash) return res.status(400).json({ error: ERR.NO_PW });

      const ok = await bcrypt.compare(password, p.passwordHash);
      if (!ok) return res.status(401).json({ error: ERR.WRONG_PW });

      const data = {};
      if (typeof dept === "string") data.dept = dept;
      if (typeof newNickname === "string") data.nickname = newNickname;

      if (handicap !== undefined && trim(handicap) !== "") {
        const h = Number(handicap);
        if (!Number.isNaN(h)) data.handicap = h;
      }

      // ✅ 새 비번 저장도 passwordHash 로
      if (newPassword && trim(newPassword) !== "") {
        data.passwordHash = await bcrypt.hash(String(newPassword), 10);
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
