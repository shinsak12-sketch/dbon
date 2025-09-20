// pages/api/places/index.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

// 간단 슬러그 생성기
function slugify(str = "") {
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\w\-가-힣]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/\-+/g, "-");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    name,
    description,
    author,
    address,
    mapUrl,
    coverImage,
    password,
    regionSlug,
  } = req.body || {};

  if (!name || !regionSlug) {
    return res.status(400).json({ error: "name과 regionSlug는 필수입니다." });
  }

  try {
    const region = await prisma.region.findUnique({
      where: { slug: regionSlug },
    });
    if (!region) return res.status(404).json({ error: "Region not found" });

    // 슬러그 유니크 보장
    let base = slugify(name);
    if (!base) base = `place-${Date.now()}`;
    let unique = base;
    let i = 1;
    while (await prisma.place.findUnique({ where: { slug: unique } })) {
      unique = `${base}-${i++}`;
    }

    const ownerPassHash = password ? await bcrypt.hash(password, 10) : null;

    const created = await prisma.place.create({
      data: {
        name,
        slug: unique,
        regionId: region.id,
        description: description || null,
        author: author || null,
        address: address || null,
        mapUrl: mapUrl || null,
        coverImage: coverImage || null,
        ownerPassHash,
      },
      select: { id: true, slug: true },
    });

    return res.status(201).json(created);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server Error" });
  }
}
