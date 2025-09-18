// pages/api/places/[id].js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { id } = req.query;
  const placeId = parseInt(id, 10);
  if (Number.isNaN(placeId)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    // GET: 단건 조회
    if (req.method === "GET") {
      const place = await prisma.place.findUnique({
        where: { id: placeId },
      });
      if (!place) return res.status(404).json({ error: "Place not found" });
      return res.status(200).json(place);
    }

    // PUT: 수정 (비밀번호 검증)
    if (req.method === "PUT") {
      const { name, description, author, address, mapUrl, coverImage, password } = req.body || {};

      const place = await prisma.place.findUnique({ where: { id: placeId } });
      if (!place) return res.status(404).json({ error: "Place not found" });

      // 등록 당시 비번이 있었다면 검증 필요
      if (place.ownerPassHash) {
        if (!password || !password.trim()) {
          return res.status(401).json({ error: "Password required" });
        }
        const ok = await bcrypt.compare(password.trim(), place.ownerPassHash);
        if (!ok) return res.status(403).json({ error: "Invalid password" });
      } else {
        // 비번 없이 등록된 글은 수정/삭제 불가 정책이면 여기서 막기
        // return res.status(401).json({ error: "This post cannot be edited (no password set)" });
      }

      const updated = await prisma.place.update({
        where: { id: placeId },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(author !== undefined ? { author } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(mapUrl !== undefined ? { mapUrl } : {}),
          ...(coverImage !== undefined ? { coverImage } : {}),
        },
      });
      return res.status(200).json(updated);
    }

    // DELETE: 삭제 (비밀번호 검증)
    if (req.method === "DELETE") {
      const { password } = req.body || {};

      const place = await prisma.place.findUnique({ where: { id: placeId } });
      if (!place) return res.status(404).json({ error: "Place not found" });

      if (place.ownerPassHash) {
        if (!password || !password.trim()) {
          return res.status(401).json({ error: "Password required" });
        }
        const ok = await bcrypt.compare(password.trim(), place.ownerPassHash);
        if (!ok) return res.status(403).json({ error: "Invalid password" });
      } else {
        // 비번 없이 등록된 글은 삭제 불가로 막고 싶다면 주석 해제
        // return res.status(401).json({ error: "This post cannot be deleted (no password set)" });
      }

      await prisma.place.delete({ where: { id: placeId } });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server Error" });
  }
}
