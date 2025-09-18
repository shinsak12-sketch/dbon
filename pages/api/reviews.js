import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { slug, rating, content, author, imageUrl, pin } = req.body || {};
  if (!slug || !rating || !content || !author || !pin)
    return res.status(400).json({ error: "필수값 누락" });

  try {
    const place = await prisma.place.findUnique({ where: { slug } });
    if (!place) return res.status(404).json({ error: "존재하지 않는 맛집" });

    await prisma.review.create({
      data: {
        placeId: place.id,
        rating: Number(rating),
        content,
        author,
        imageUrl: imageUrl || null,
        pin
      }
    });

    const { _avg, _count } = await prisma.review.aggregate({
      where: { placeId: place.id },
      _avg: { rating: true },
      _count: { rating: true }
    });

    await prisma.place.update({
      where: { id: place.id },
      data: {
        avgRating: Math.round((_avg.rating || 0) * 10) / 10,
        reviewsCount: _count.rating
      }
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "서버 오류" });
  }
}
