// pages/api/champ/me.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // 로그인
    try {
      const { name, password, nickname } = req.body || {};
      if (!name || !password) {
        return res.status(400).json({ error: "NAME_AND_PASSWORD_REQUIRED" });
      }

      // 동명이인 대비: 이름으로 찾고, 여러 명이면 닉네임 필요
      const people = await prisma.participant.findMany({
        where: { name: String(name).trim() },
      });

      if (people.length === 0) {
        return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });
      }
      let p = people[0];
      if (people.length > 1) {
        if (!nickname) {
          return res.status(400).json({ error: "NEED_NICKNAME" });
        }
        p = people.find((x) => (x.nickname || "").trim() === String(nickname).trim());
        if (!p) {
          return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });
        }
      }

      if (!p.passhash) {
        // 비밀번호가 아직 없는 계정
        return res.status(400).json({ error: "NO_PASSWORD_SET" });
      }

      const ok = await bcrypt.compare(String(password), p.passhash);
      if (!ok) return res.status(401).json({ error: "WRONG_PASSWORD" });

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
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  if (req.method === "PUT") {
    // 내정보 수정(닉/소속/핸디, 새 비번)
    try {
      const { name, password, nickname, dept, handicap, newPassword } = req.body || {};
      if (!name || !password) {
        return res.status(400).json({ error: "NAME_AND_PASSWORD_REQUIRED" });
      }

      // 동일한 동명이인 로직
      const people = await prisma.participant.findMany({ where: { name: String(name).trim() } });
      if (people.length === 0) return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });

      let p = people[0];
      if (people.length > 1) {
        if (!nickname) return res.status(400).json({ error: "NEED_NICKNAME" });
        p = people.find((x) => (x.nickname || "").trim() === String(nickname).trim());
        if (!p) return res.status(404).json({ error: "PARTICIPANT_NOT_FOUND" });
      }

      if (!p.passhash) return res.status(400).json({ error: "NO_PASSWORD_SET" });
      const ok = await bcrypt.compare(String(password), p.passhash);
      if (!ok) return res.status(401).json({ error: "WRONG_PASSWORD" });

      const data = {
        dept: typeof dept === "string" ? dept : p.dept,
        nickname: typeof nickname === "string" ? nickname : p.nickname,
      };
      if (handicap !== undefined && handicap !== null && String(handicap).trim() !== "") {
        const h = Number(handicap);
        if (!Number.isNaN(h)) data.handicap = h;
      }
      if (newPassword && String(newPassword).trim() !== "") {
        data.passhash = await bcrypt.hash(String(newPassword), 10);
      }

      const updated = await prisma.participant.update({ where: { id: p.id }, data });

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
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  res.setHeader("Allow", ["POST", "PUT"]);
  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
