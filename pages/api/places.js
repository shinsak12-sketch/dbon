import prisma from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { name, slug, regionSlug } = req.body || {};
  if (!name || !slug || !regionSlug) return res.status(400).json({ error: "필수값 누락" });

  try {
    const region = await prisma.region.findUnique({ where: { slug: regionSlug } });
    if (!region) return res.status(400).json({ error: "존재하지 않는 지역" });

    const created = await prisma.place.create({
      data: { name, slug, regionId: region.id }
    });

    // 집계 초기값
    await prisma.place.update({
      where: { id: created.id },
      data: { avgRating: 0, reviewsCount: 0 }
    });

    return res.status(200).json({ id: created.id });
  } catch (e) {
    if (e.code === "P2002") {
      return res.status(409).json({ error: "이미 존재하는 슬러그" });
    }
    console.error(e);
    return res.status(500).json({ error: "서버 오류" });
  }
}
