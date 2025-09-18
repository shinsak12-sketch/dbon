import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "잘못된 요청" });

  try {
    const review = await prisma.review.findUnique({ where: { id }, include: { place: true } });
    if (!review) return res.status(404).json({ error: "리뷰 없음" });

    if (req.method === "PUT") {
      const { rating, content, author, imageUrl, pin } = req.body || {};
      if (!pin) return res.status(400).json({ error: "비밀번호 필요" });
      if (pin !== review.pin) return res.status(403).json({ error: "비밀번호 불일치" });

      await prisma.review.update({
        where: { id },
        data: { rating: Number(rating), content, author, imageUrl }
      });

      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { pin } = req.body || {};
      if (!pin) return res.status(400).json({ error: "비밀번호 필요" });
      if (pin !== review.pin) return res.status(403).json({ error: "비밀번호 불일치" });

      await prisma.review.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "서버 오류" });
  }
}
