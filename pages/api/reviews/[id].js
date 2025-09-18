// pages/api/reviews/[id].js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const idNum = Number(req.query.id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return res.status(400).json({ error: "잘못된 요청" });
  }

  try {
    // 공통: 리뷰 + 소속 가게
    const review = await prisma.review.findUnique({
      where: { id: idNum },
      include: { place: true },
    });
    if (!review) return res.status(404).json({ error: "리뷰 없음" });

    // GET: 단건 조회
    if (req.method === "GET") {
      return res.status(200).json(review);
    }

    // PUT: 수정
    if (req.method === "PUT") {
      const { rating, content, author, imageUrl, pin } = req.body || {};

      if (typeof pin !== "string" || pin.trim() === "") {
        return res.status(400).json({ error: "비밀번호 필요" });
      }
      if (pin.trim() !== (review.pin || "")) {
        return res.status(403).json({ error: "비밀번호 불일치" });
      }

      // 평점 유효성 체크
      const ratingNum = Number(rating);
      if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: "평점은 1~5 사이 숫자" });
      }

      await prisma.$transaction(async (tx) => {
        // 1) 리뷰 업데이트
        await tx.review.update({
          where: { id: idNum },
          data: {
            rating: ratingNum,
            content: content ?? review.content,
            author: author ?? review.author,
            imageUrl: imageUrl ?? review.imageUrl,
          },
        });

        // 2) 가게 평점/리뷰수 재계산
        const agg = await tx.review.aggregate({
          where: { placeId: review.placeId },
          _avg: { rating: true },
          _count: { id: true },
        });

        await tx.place.update({
          where: { id: review.placeId },
          data: {
            avgRating: Number(agg._avg.rating || 0),
            reviewsCount: agg._count.id,
          },
        });
      });

      return res.status(200).json({ ok: true });
    }

    // DELETE: 삭제
    if (req.method === "DELETE") {
      const { pin } = req.body || {};
      if (typeof pin !== "string" || pin.trim() === "") {
        return res.status(400).json({ error: "비밀번호 필요" });
      }
      if (pin.trim() !== (review.pin || "")) {
        return res.status(403).json({ error: "비밀번호 불일치" });
      }

      await prisma.$transaction(async (tx) => {
        // 1) 리뷰 삭제
        await tx.review.delete({ where: { id: idNum } });

        // 2) 가게 평점/리뷰수 재계산
        const agg = await tx.review.aggregate({
          where: { placeId: review.placeId },
          _avg: { rating: true },
          _count: { id: true },
        });

        await tx.place.update({
          where: { id: review.placeId },
          data: {
            avgRating: Number(agg._avg.rating || 0),
            reviewsCount: agg._count.id,
          },
        });
      });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "서버 오류" });
  }
}
