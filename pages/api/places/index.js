// pages/api/places/index.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const {
        regionSlug,
        name,
        description,
        author,
        address,
        mapUrl,
        coverImage,
        password,
      } = req.body || {};

      if (!regionSlug) {
        return res.status(400).json({ error: "REGION_REQUIRED" });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "NAME_REQUIRED" });
      }
      if (!coverImage || !coverImage.trim()) {
        return res.status(400).json({ error: "COVER_IMAGE_REQUIRED" });
      }

      // region 확인
      const region = await prisma.region.findUnique({
        where: { slug: String(regionSlug) },
      });
      if (!region) {
        return res.status(404).json({ error: "REGION_NOT_FOUND" });
      }

      // slug 자동 생성 (이름 기반, 중복 방지)
      const baseSlug = String(name).trim().toLowerCase().replace(/\s+/g, "-");
      let slug = baseSlug;
      let counter = 1;
      while (await prisma.place.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter++}`;
      }

      // 비밀번호 해시
      let ownerPassHash = null;
      if (password && String(password).trim()) {
        ownerPassHash = await bcrypt.hash(String(password), 10);
      }

      const place = await prisma.place.create({
        data: {
          name: String(name).trim(),
          slug,
          regionId: region.id,
          description: description || null,
          author: author || null,
          address: address || null,
          mapUrl: mapUrl || null,
          coverImage: coverImage || null,
          ownerPassHash,
        },
      });

      return res.status(201).json(place);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
