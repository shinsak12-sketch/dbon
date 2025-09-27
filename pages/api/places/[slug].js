// pages/api/places/[slug].js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

// 간단 유틸: 문자열 배열 정리
function toStringArray(v) {
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  if (v === null || v === undefined) return [];
  return [String(v).trim()].filter(Boolean);
}

export default async function handler(req, res) {
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

    // PUT: 수정
    if (req.method === "PUT") {
      const {
        name,
        description,
        author,
        address,
        mapUrl,
        // ✅ 새 필드(여러 장)
        coverImages,
        // ⬇️ 레거시 단일 필드도 계속 받되, 없으면 coverImages[0]으로 맞춰줌
        coverImage,
        // 비밀번호
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

      // 업데이트 payload 구성
      const data = {};

      if (name !== undefined) data.name = String(name).trim();
      if (description !== undefined) data.description = description ?? null;
      if (author !== undefined) data.author = author ?? null;
      if (address !== undefined) data.address = address ?? null;
      if (mapUrl !== undefined) data.mapUrl = mapUrl ?? null;

      // ✅ coverImages 배열 지원
      if (coverImages !== undefined) {
        const arr = toStringArray(coverImages);
        // Prisma String[]는 set 로 덮어쓰기
        data.coverImages = { set: arr };

        // 단일 coverImage가 따로 안 왔으면 첫 장을 대표로 동기화
        if (coverImage === undefined) {
          data.coverImage = arr[0] || null;
        }
      }

      // ⬇️ 단일 coverImage가 명시되면 그 값으로 강제 동기화
      if (coverImage !== undefined) {
        data.coverImage = coverImage ? String(coverImage).trim() : null;
      }

      const updated = await prisma.place.update({ where, data });
      return res.status(200).json(updated);
    }

    // DELETE: 삭제
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
