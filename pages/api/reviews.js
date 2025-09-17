import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { slug, rating, content } = req.body;
  if (!slug || !rating || !content) return res.status(400).json({ error: "필수값 누락" });

  try {
    const place = await prisma.place.findUnique({ where: { slug } });
    if (!place) return res.status(404).json({ error: "존재하지 않는 맛집" });

    // 리뷰 저장
    const review = await prisma.review.create({
      data: { placeId: place.id, rating: Number(rating), content }
    });

    // 평균/개수 갱신
    const reviews = await prisma.review.findMany({ where: { placeId: place.id } });
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / reviews.length;

    await prisma.place.update({
      where: { id: place.id },
      data: { avgRating: Math.round(avg * 10) / 10, reviewsCount: reviews.length }
    });

    return res.status(200).json(review);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "서버 오류" });
  }
}
