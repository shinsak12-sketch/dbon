// pages/api/places.js
import prisma from "../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { name, slug, region, address, mapUrl, coverImage, description, author, ownerPass } = req.body;

      // 비밀번호 해시 처리
      let ownerPassHash = null;
      if (ownerPass && ownerPass.length > 0) {
        const salt = await bcrypt.genSalt(10);
        ownerPassHash = await bcrypt.hash(ownerPass, salt);
      }

      const place = await prisma.place.create({
        data: {
          name,
          slug,
          region: { connect: { id: Number(region) } },
          address,
          mapUrl,
          coverImage,
          description,   // 소개글
          author,        // 작성자
          ownerPassHash, // 수정/삭제용 비밀번호
        },
      });

      res.status(200).json(place);
    } catch (err) {
      console.error("Error creating place:", err);
      res.status(500).json({ error: "맛집 등록 중 오류 발생" });
    }
  } else if (req.method === "PUT") {
    try {
      const { id, name, address, mapUrl, coverImage, description, author, ownerPass } = req.body;

      const place = await prisma.place.findUnique({ where: { id: Number(id) } });
      if (!place) return res.status(404).json({ error: "해당 맛집을 찾을 수 없음" });

      // 비밀번호 검증
      const valid = await bcrypt.compare(ownerPass, place.ownerPassHash || "");
      if (!valid) return res.status(403).json({ error: "비밀번호 불일치" });

      const updated = await prisma.place.update({
        where: { id: Number(id) },
        data: {
          name,
          address,
          mapUrl,
          coverImage,
          description,
          author,
        },
      });

      res.status(200).json(updated);
    } catch (err) {
      console.error("Error updating place:", err);
      res.status(500).json({ error: "맛집 수정 중 오류 발생" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { id, ownerPass } = req.body;

      const place = await prisma.place.findUnique({ where: { id: Number(id) } });
      if (!place) return res.status(404).json({ error: "해당 맛집을 찾을 수 없음" });

      // 비밀번호 검증
      const valid = await bcrypt.compare(ownerPass, place.ownerPassHash || "");
      if (!valid) return res.status(403).json({ error: "비밀번호 불일치" });

      await prisma.place.delete({ where: { id: Number(id) } });

      res.status(200).json({ message: "삭제 완료" });
    } catch (err) {
      console.error("Error deleting place:", err);
      res.status(500).json({ error: "맛집 삭제 중 오류 발생" });
    }
  } else {
    res.setHeader("Allow", ["POST", "PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
