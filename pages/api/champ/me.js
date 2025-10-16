// pages/api/champ/me.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

const ERR = {
  NEED_NAME_PW: "NAME_AND_PASSWORD_REQUIRED",
  NOT_FOUND: "해당 선수가 등록되어 있지 않습니다. 참가 등록을 먼저 해주세요.",
  NEED_NICK: "AMBIGUOUS_NAME_NEED_NICKNAME",
  NO_PW: "NO_PASSWORD_SET",
  WRONG_PW: "WRONG_PASSWORD",
  BAD_TYPE: "INVALID_PARTICIPANT_TYPE",
  FAMILY_NEED_NAME: "FAMILY_NAME_REQUIRED",
  METHOD: "METHOD_NOT_ALLOWED",
  SERVER: "SERVER_ERROR",
};

const trim = (s) => String(s ?? "").trim();
const ci = (v) => ({ equals: v, mode: "insensitive" });
const normType = (t) => {
  const x = String(t || "").toUpperCase();
  return x === "FAMILY" ? "FAMILY" : x === "EMPLOYEE" ? "EMPLOYEE" : null;
};

async function findByNameOrNameNick(name, nickname) {
  if (nickname) {
    const p = await prisma.participant.findFirst({
      where: { name: ci(name), nickname: ci(nickname) },
    });
    return { p, needNick: false };
  }
  const people = await prisma.participant.findMany({ where: { name: ci(name) } });
  if (people.length === 0) return { p: null, needNick: false };
  if (people.length > 1) return { p: null, needNick: true };
  return { p: people[0], needNick: false };
}

function toMeDTO(p) {
  return {
    id: p.id,
    name: p.name,
    dept: p.dept,
    nickname: p.nickname,
    handicap: p.handicap,
    type: p.type || "EMPLOYEE",
    familyName: p.familyName || null,
  };
}

export default async function handler(req, res) {
  // ─────────────────────────────── POST: 로그인 ───────────────────────────────
  if (req.method === "POST") {
    try {
      const name = trim(req.body?.name);
      const password = String(req.body?.password ?? "");
      const nickname = trim(req.body?.nickname);
      if (!name || !password) return res.status(400).json({ error: ERR.NEED_NAME_PW });

      const { p, needNick } = await findByNameOrNameNick(name, nickname || null);
      if (!p) {
        if (needNick) return res.status(400).json({ error: ERR.NEED_NICK });
        return res.status(404).json({ error: ERR.NOT_FOUND });
      }

      if (!p.passwordHash) return res.status(400).json({ error: ERR.NO_PW });
      const ok = await bcrypt.compare(password, p.passwordHash);
      if (!ok) return res.status(401).json({ error: ERR.WRONG_PW });

      const scores = await prisma.score.findMany({
        where: { participantId: p.id },
        include: { event: { include: { season: true } } },
        orderBy: [{ createdAt: "desc" }],
      });

      return res.status(200).json({ ok: true, me: toMeDTO(p), scores });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: ERR.SERVER });
    }
  }

  // ─────────────────────────────── PUT: 내 정보 수정 ───────────────────────────────
  if (req.method === "PUT") {
    try {
      const name = trim(req.body?.name);
      const password = String(req.body?.password ?? "");
      const matchNickname = trim(req.body?.matchNickname); // 동명이인 매칭용(현재 닉)
      const newNickname = req.body?.nickname;             // 변경 닉
      const dept = req.body?.dept;
      const handicap = req.body?.handicap;
      const newPassword = req.body?.newPassword;

      // ✅ 새 필드
      const typeRaw = req.body?.type;                     // EMPLOYEE | FAMILY
      const familyNameRaw = req.body?.familyName;         // 문자열/null

      if (!name || !password) return res.status(400).json({ error: ERR.NEED_NAME_PW });

      let p;
      if (matchNickname) {
        p = await prisma.participant.findFirst({
          where: { name: ci(name), nickname: ci(matchNickname) },
        });
        if (!p) return res.status(404).json({ error: ERR.NOT_FOUND });
      } else {
        const { p: found, needNick } = await findByNameOrNameNick(name, null);
        if (!found) {
          if (needNick) return res.status(400).json({ error: ERR.NEED_NICK });
          return res.status(404).json({ error: ERR.NOT_FOUND });
        }
        p = found;
      }

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

      // 새 비밀번호
      if (newPassword && trim(newPassword) !== "") {
        data.passwordHash = await bcrypt.hash(String(newPassword), 10);
      }

      // ✅ 참가자 구분/가족명 처리
      if (typeRaw !== undefined) {
        const t = normType(typeRaw);
        if (!t) return res.status(400).json({ error: ERR.BAD_TYPE });
        data.type = t;
        if (t === "FAMILY") {
          const fam = trim(familyNameRaw);
          if (!fam) return res.status(400).json({ error: ERR.FAMILY_NEED_NAME });
          data.familyName = fam;
        } else {
          // 직원이면 가족명 비움
          data.familyName = null;
        }
      } else if (familyNameRaw !== undefined) {
        // type 변경은 없고 가족명만 왔을 때: 현재 type이 FAMILY인지 확인
        const isFamily = (p.type || "EMPLOYEE") === "FAMILY";
        if (!isFamily) {
          // 직원이면 무시(또는 null 강제)
          data.familyName = null;
        } else {
          const fam = trim(familyNameRaw);
          if (!fam) return res.status(400).json({ error: ERR.FAMILY_NEED_NAME });
          data.familyName = fam;
        }
      }

      const updated = await prisma.participant.update({ where: { id: p.id }, data });

      return res.status(200).json({ ok: true, me: toMeDTO(updated) });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: ERR.SERVER });
    }
  }

  res.setHeader("Allow", ["POST", "PUT"]);
  return res.status(405).json({ error: ERR.METHOD });
}
