// pages/api/places/index.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

function slugifyBase(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    // 영문/숫자/한글은 살리고, 나머지는 - 로
    .replace(/[^\w가-힣]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      name,
      regionSlug,           // URL의 [slug] 그대로 넘김
      description,
      author,
      address,
      mapUrl,
      coverImage,
      ownerPass,            // 수정/삭제용 평문 비번
    } = req.body || {};

    if (!name || !regionSlug || !coverImage) {
      return res.status(400).json({ error: "REQUIRED_MISSING" });
    }

    const region = await prisma.region.findUnique({
      where: { slug: String(regionSlug) },
    });
    if (!region) return res.status(400).json({ error: "INVALID_REGION" });

    // 비번 해시
    let ownerPassHash = null;
    if (ownerPass && String(ownerPass).trim()) {
      ownerPassHash = await bcrypt.hash(String(ownerPass).trim(), 10);
    }

    // 고유 slug 생성 (지역-slug + 가게명 기반 중복 회피)
    const base = slugifyBase(name) || "place";
    let slug = `${region.slug}-${base}`.slice(0, 80);
    let n = 0;
    // 중복이면 -2, -3 … 붙여서 유니크 보장
    while (await prisma.place.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${region.slug}-${base}-${n}`;
    }

    const place = await prisma.place.create({
      data: {
        name,
        slug,
        regionId: region.id,
        description: description || null,
        author: author || null,
        address: address || null,
        mapUrl: mapUrl || null,
        coverImage,
        ownerPassHash,
      },
    });

    return res.status(201).json({ ok: true, place });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server Error" });
  }
}
