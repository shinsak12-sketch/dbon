// pages/api/places.js
import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { name, slug, regionSlug, address, mapUrl } = req.body || {};
  if (!name || !slug || !regionSlug) {
    return res.status(400).json({ error: "필수값(name, slug, regionSlug) 누락" });
  }

  try {
    const region = await prisma.region.findUnique({ where: { slug: regionSlug } });
    if (!region) return res.status(400).json({ error: "존재하지 않는 지역" });

    const created = await prisma.place.create({
      data: {
        name,
        slug,
        regionId: region.id,
        address: address || null,
        mapUrl: mapUrl || null,
        // 평균/리뷰수 초기화(스키마 기본값이 있어도 한번 더 보장)
        avgRating: 0,
        reviewsCount: 0
      }
    });

    return res.status(200).json({ id: created.id, slug: created.slug });
  } catch (e) {
    // Prisma 고유키 충돌
    if (e.code === "P2002") {
      return res.status(409).json({ error: "이미 존재하는 슬러그입니다." });
    }
    console.error(e);
    return res.status(500).json({ error: "서버 오류" });
  }
}
