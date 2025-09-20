// pages/api/reviews/[id].js
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
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "INVALID_ID" });

  try {
    // 공통 로드
    const review = await prisma.review.findUnique({
      where: { id },
      include: { place: { select: { id: true, slug: true, name: true } } },
    });
    if (!review) return res.status(404).json({ error: "REVIEW_NOT_FOUND" });

    // --------------------------
    // GET /api/reviews/:id
    // --------------------------
    if (req.method === "GET") {
      // 핀은 보안상 전달하지 않음
      const { pin, ...safe } = review;
      return res.status(200).json({ ok: true, review: safe });
    }

    // --------------------------
    // PUT /api/reviews/:id
    // body: { rating?, content?, author?, imageUrl?, pin(현재 비번), newPin? }
    // --------------------------
    if (req.method === "PUT") {
      const { rating, content, author, imageUrl, pin, newPin } = req.body || {};

      // PIN 검증 (리뷰에 PIN이 설정된 경우)
      if (review.pin) {
        if (!pin || String(pin) !== String(review.pin)) {
          return res.status(403).json({ error: "PIN_MISMATCH" });
        }
      }

      // 업데이트 데이터 구성
      const data = {};
      if (rating !== undefined) {
        const r = Number(rating);
        if (!r || r < 0.5 || r > 5) return res.status(400).json({ error: "INVALID_RATING" });
        data.rating = r;
      }
      if (content !== undefined) data.content = String(content);
      if (author !== undefined) data.author = author ? String(author) : null;
      if (imageUrl !== undefined) data.imageUrl = imageUrl ? String(imageUrl) : null;
      if (newPin !== undefined) data.pin = newPin ? String(newPin) : null;

      await prisma.review.update({ where: { id }, data });
      await recalc(review.placeId);

      return res.status(200).json({ ok: true });
    }

    // --------------------------
    // DELETE /api/reviews/:id
    // body: { pin? }
    // --------------------------
    if (req.method === "DELETE") {
      const { pin } = req.body || {};
      if (review.pin) {
        if (!pin || String(pin) !== String(review.pin)) {
          return res.status(403).json({ error: "PIN_MISMATCH" });
        }
      }

      await prisma.review.delete({ where: { id } });
      await recalc(review.placeId);

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
