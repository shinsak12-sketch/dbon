// pages/api/champ/participants/set-password.js
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

const ERR = {
  METHOD: "METHOD_NOT_ALLOWED",
  NEED_NAME_PW: "NAME_AND_PASSWORD_REQUIRED",
  NOT_FOUND: "PARTICIPANT_NOT_FOUND",
  AMBIGUOUS: "AMBIGUOUS_NAME_NEED_NICKNAME",
  ALREADY_SET: "ALREADY_SET",
  SERVER: "SERVER_ERROR",
};

const trim = (s) => String(s ?? "").trim();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: ERR.METHOD });
  }

  try {
    const name = trim(req.body?.name);
    const password = trim(req.body?.password);
    const nickname = trim(req.body?.nickname);

    if (!name || !password) {
      return res.status(400).json({ error: ERR.NEED_NAME_PW });
    }

    // 1) 이름으로 후보 검색 (대소문자 무시)
    const candidates = await prisma.participant.findMany({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true, name: true, nickname: true, passwordHash: true },
    });

    if (candidates.length === 0) {
      return res.status(404).json({ error: ERR.NOT_FOUND });
    }

    // 2) 동명이인 처리
    let target = null;
    if (candidates.length === 1) {
      target = candidates[0];
    } else {
      // 닉네임 필수
      if (!nickname) {
        return res.status(409).json({ error: ERR.AMBIGUOUS });
      }
      const hit = candidates.find(
        (p) => trim(p.nickname).toLowerCase() === nickname.toLowerCase()
      );
      if (!hit) return res.status(404).json({ error: ERR.NOT_FOUND });
      target = hit;
    }

    // 3) 이미 비밀번호가 있으면 막기
    if (trim(target.passwordHash)) {
      return res.status(409).json({ error: ERR.ALREADY_SET });
    }

    // 4) 해시 생성 후 업데이트 (id는 유니크)
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.participant.update({
      where: { id: target.id },
      data: { passwordHash },
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("set-password error:", e);
    return res.status(500).json({ error: ERR.SERVER });
  }
}
