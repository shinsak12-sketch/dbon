// pages/api/places/[slug].js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  // URL 파라미터 이름은 slug지만, 숫자면 id로도 동작하게 처리
  const { slug } = req.query;
  const isId = /^[0-9]+$/.test(String(slug));
  const where = isId ? { id: parseInt(slug, 10) } : { slug: String(slug) };

  try {
    const loadPlace = async () => prisma.place.findUnique({ where });

    // GET: 단건 조회
    if (req.method === "GET") {
      const place = await loadPlace();
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });
      return res.status(200).json(place);
    }

    // PUT: 수정 (비밀번호 있는 글이면 검증)
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

    // DELETE: 삭제 (비밀번호 있는 글이면 검증)
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

      // 리뷰 먼저 제거 후 place 삭제
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
