import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const place = await prisma.place.findUnique({
      where: { id: Number(id) },
    });
    return res.json(place);
  }

  if (req.method === "PUT") {
    const { name, region, address, mapUrl, coverImage, description, author, ownerPass } = req.body;

    const place = await prisma.place.findUnique({
      where: { id: Number(id) },
    });

    if (!place) return res.status(404).json({ error: "존재하지 않는 맛집입니다." });

    // 비밀번호 확인
    if (place.ownerPassHash && ownerPass) {
      const ok = await bcrypt.compare(ownerPass, place.ownerPassHash);
      if (!ok) return res.status(403).json({ error: "비밀번호가 일치하지 않습니다." });
    }

    const updated = await prisma.place.update({
      where: { id: Number(id) },
      data: { name, region, address, mapUrl, coverImage, description, author },
    });

    return res.json(updated);
  }

  if (req.method === "DELETE") {
    const { ownerPass } = req.body;

    const place = await prisma.place.findUnique({
      where: { id: Number(id) },
    });

    if (!place) return res.status(404).json({ error: "존재하지 않는 맛집입니다." });

    // 비밀번호 확인
    if (place.ownerPassHash && ownerPass) {
      const ok = await bcrypt.compare(ownerPass, place.ownerPassHash);
      if (!ok) return res.status(403).json({ error: "비밀번호가 일치하지 않습니다." });
    }

    await prisma.place.delete({ where: { id: Number(id) } });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: "지원하지 않는 메서드입니다." });
}
