// pages/api/admin/backfill-authors.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  // 🔐 보안 토큰 체크
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_BACKFILL_TOKEN || token !== process.env.ADMIN_BACKFILL_TOKEN) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    // author 없는 place 전부 조회
    const targets = await prisma.place.findMany({
      where: { OR: [{ author: null }, { author: "" }] },
      select: { id: true, name: true },
    });

    let updated = 0;

    for (const p of targets) {
      // 가장 첫 리뷰 작성자 찾기
      const firstReview = await prisma.review.findFirst({
        where: { placeId: p.id, author: { not: null } },
        orderBy: { createdAt: "asc" },
        select: { author: true },
      });

      if (firstReview?.author && String(firstReview.author).trim() !== "") {
        await prisma.place.update({
          where: { id: p.id },
          data: { author: String(firstReview.author).trim() },
        });
        updated++;
      }
    }

    return res.status(200).json({ ok: true, total: targets.length, updated });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
