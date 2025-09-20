// pages/api/reviews/index.js
import prisma from "../../../lib/prisma";

/** 가게의 평균 평점 / 리뷰 수 재계산 */
async function recalc(placeId) {
  const agg = await prisma.review.aggregate({
    where: { placeId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.place.update({
    where: { id: placeId },
    data: {
      avgRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : 0,
      reviewsCount: agg._count._all,
    },
  });
}

export default async function handler(req, res) {
  // --------------------------
  // GET /api/reviews
  //  - slug 또는 placeId 중 하나로 특정 가게의 리뷰 목록 조회
  //  - 옵션: limit(기본 20), page(기본 1)
  // --------------------------
  if (req.method === "GET") {
    try {
      const { slug, placeId, limit = 20, page = 1 } = req.query;

      let place = null;
      if (slug) {
        place = await prisma.place.findUnique({
          where: { slug: String(slug) },
          select: { id: true },
        });
      } else if (placeId) {
        place = await prisma.place.findUnique({
          where: { id: Number(placeId) },
          select: { id: true },
        });
      } else {
        return res.status(400).json({ error: "PLACE_SELECTOR_REQUIRED" });
      }

      if (!place) return res.status(404).json({ error: "PLACE_NOT_FOUND" });

      const take = Math.min(Math.max(Number(limit), 1), 100);
      const skip = (Math.max(Number(page), 1) - 1) * take;

      const reviews = await prisma.review.findMany({
        where: { placeId: place.id },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          rating: true,
          content: true,
          author: true,
          imageUrl: true,
          createdAt: true,
        },
      });

      const total = await prisma.review.count({ where: { placeId: place.id } });

      return res.status(200).json({
        ok: true,
        reviews,
        pagination: { total, page: Number(page), limit: take },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  // --------------------------
  // POST /api/reviews
  //  - slug 또는 placeId 중 하나로 대상 가게 지정
  //  - body: { rating(0.5~5), content, author?, imageUrl?, pin? }
  // --------------------------
  if (req.method === "POST") {
    try {
      const { slug, placeId, rating, content, author, imageUrl, pin } = req.body || {};

      // 대상 가게 찾기
      let place = null;
      if (slug) {
        place = await prisma.place.findUnique({ where: { slug: String(slug) } });
      } else if (placeId) {
        place = await prisma.place.findUnique({ where: { id: Number(placeId) } });
      }
      if (!place) return res.status(404).json({ error: "PLACE_NOT_FOUND" });

      // 입력 검증
      const r = Number(rating);
      if (!r || r < 0.5 || r > 5) {
        return res.status(400).json({ error: "INVALID_RATING" });
      }
      if (!content || !String(content).trim()) {
        return res.status(400).json({ error: "CONTENT_REQUIRED" });
      }

      // 생성
      const review = await prisma.review.create({
        data: {
          placeId: place.id,
          rating: r,
          content: String(content),
          author: author ? String(author) : null,
          imageUrl: imageUrl ? String(imageUrl) : null,
          pin: pin ? String(pin) : null, // 선택 비번
        },
        select: { id: true },
      });

      // 집계 업데이트
      await recalc(place.id);

      return res.status(201).json({ ok: true, reviewId: review.id });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
