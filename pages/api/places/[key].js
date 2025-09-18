// pages/api/places/[key].js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { key } = req.query;

  // key 가 숫자면 id, 아니면 slug
  const isId = /^[0-9]+$/.test(String(key));
  const where = isId ? { id: parseInt(key, 10) } : { slug: String(key) };

  try {
    // 공통: 대상 place 로드
    const loadPlace = async () => prisma.place.findUnique({ where });

    // GET: 단건 조회
    if (req.method === "GET") {
      const place = await loadPlace();
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });
      return res.status(200).json(place);
    }

    // PUT: 수정 (ownerPassHash 있으면 비번 검증)
    if (req.method === "PUT") {
      const {
        name,
        description,
        author,
        address,
        mapUrl,
        coverImage,
        password,
      } = req.body || {};

      const place = await loadPlace();
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });

      if (place.ownerPassHash) {
        if (!password || !String(password).trim()) {
          return res.status(400).json({ error: "PASSWORD_REQUIRED" });
        }
        const ok = await bcrypt.compare(String(password), place.ownerPassHash);
        if (!ok) return res.status(403).json({ error: "INVALID_PASSWORD" });
      }
      // 비번 없이 등록된 글은 수정 금지하려면 아래 주석 해제
      // else return res.status(401).json({ error: "NO_PASSWORD_SET" });

      const updated = await prisma.place.update({
        where,
        data: {
          ...(name !== undefined ? { name: String(name).trim() } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(author !== undefined ? { author } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(mapUrl !== undefined ? { mapUrl } : {}),
          ...(coverImage !== undefined ? { coverImage } : {}),
        },
      });
      return res.status(200).json(updated);
    }

    // DELETE: 삭제 (ownerPassHash 있으면 비번 검증)
    if (req.method === "DELETE") {
      const { password } = req.body || {};

      const place = await loadPlace();
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });

      if (place.ownerPassHash) {
        if (!password || !String(password).trim()) {
          return res.status(400).json({ error: "PASSWORD_REQUIRED" });
        }
        const ok = await bcrypt.compare(String(password), place.ownerPassHash);
        if (!ok) return res.status(403).json({ error: "INVALID_PASSWORD" });
      }
      // 비번 없이 등록된 글은 삭제 금지하려면 아래 주석 해제
      // else return res.status(401).json({ error: "NO_PASSWORD_SET" });

      // 관련 리뷰 먼저 삭제 후 place 삭제
      await prisma.review.deleteMany({ where: { placeId: place.id } });
      await prisma.place.delete({ where });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server Error" });
  }
}
