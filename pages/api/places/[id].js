import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { id } = req.query;

  // 삭제 처리
  if (req.method === "DELETE") {
    const { password } = req.body;

    try {
      // 1) DB에서 해당 place 찾기
      const place = await prisma.place.findUnique({
        where: { id: parseInt(id) },
      });

      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }

      // 2) 비밀번호 확인
      const isValid = await bcrypt.compare(password, place.ownerPassHash || "");
      if (!isValid) {
        return res.status(403).json({ error: "Invalid password" });
      }

      // 3) 삭제
      await prisma.place.delete({
        where: { id: parseInt(id) },
      });

      return res.status(200).json({ message: "삭제 성공" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "서버 에러" });
    }
  }

  res.setHeader("Allow", ["DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
