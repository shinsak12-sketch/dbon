// pages/api/places/index.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

/** 가게명 → 슬러그 베이스 */
function slugifyBase(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    // 영문/숫자/한글은 살리고, 나머지는 하이픈으로
    .replace(/[^\w가-힣]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const {
      name,
      regionSlug,     // /places/[slug]/new 에서 전달됨
      description,
      author,
      address,
      mapUrl,
      coverImage,     // ✅ 선택 사항 (없어도 됨)
      ownerPass,      // 선택(수정/삭제용)
    } = req.body || {};

    // 필수값 체크
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "NAME_REQUIRED" });
    }
    if (!regionSlug || !String(regionSlug).trim()) {
      return res.status(400).json({ error: "REGION_REQUIRED" });
    }
    // ✅ coverImage 필수 검사 제거

    // 지역 확인
    const region = await prisma.region.findUnique({
      where: { slug: String(regionSlug) },
      select: { id: true, slug: true },
    });
    if (!region) return res.status(400).json({ error: "INVALID_REGION" });

    // 비밀번호 해시(선택)
    let ownerPassHash = null;
    if (ownerPass && String(ownerPass).trim()) {
      ownerPassHash = await bcrypt.hash(String(ownerPass).trim(), 10);
    }

    // 고유 place slug 생성: {region.slug}-{name-slug}-{n}
    const base = slugifyBase(name) || "place";
    let slug = `${region.slug}-${base}`.slice(0, 80);
    let n = 0;
    while (await prisma.place.findUnique({ where: { slug } })) {
      n += 1;
      slug = `${region.slug}-${base}-${n}`;
    }

    // 생성
    const place = await prisma.place.create({
      data: {
        name: String(name).trim(),
        slug,
        regionId: region.id,
        description: description ? String(description) : null,
        author: author ? String(author) : null,
        address: address ? String(address) : null,
        mapUrl: mapUrl ? String(mapUrl) : null,
        // ✅ 이미지가 없으면 null 저장 (Prisma 스키마에서 String? 이어야 함)
        coverImage:
          coverImage && String(coverImage).trim()
            ? String(coverImage).trim()
            : null,
        ownerPassHash,
        // avgRating, reviewsCount 는 기본값 0
      },
      select: { id: true, slug: true },
    });

    return res.status(201).json({ ok: true, place });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
