// pages/api/places/index.js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

/** 이름 → slug 베이스 */
function slugifyBase(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** region id 얻기: regionSlug 또는 region(id) 모두 지원 */
async function resolveRegionId({ regionSlug, region }) {
  if (region && String(region).trim()) {
    return Number(region);
  }
  if (regionSlug && String(regionSlug).trim()) {
    const r = await prisma.region.findUnique({
      where: { slug: String(regionSlug) },
      select: { id: true },
    });
    return r?.id ?? null;
  }
  return null;
}

/** place 조회: id 또는 slug 둘 다 지원 */
async function findPlaceByIdOrSlug({ id, slug }) {
  if (id) return prisma.place.findUnique({ where: { id: Number(id) } });
  if (slug) return prisma.place.findUnique({ where: { slug: String(slug) } });
  return null;
}

export default async function handler(req, res) {
  // -------------------- 생성 --------------------
  if (req.method === "POST") {
    try {
      const {
        // 새 입력 (권장)
        name,
        regionSlug,         // 또는 아래의 region(숫자 id)
        description,
        author,
        address,
        mapUrl,
        coverImage,         // 선택
        ownerPass,          // 선택
        // 호환 입력
        slug: providedSlug, // 예전 API가 넘기던 값(있으면 그대로 사용)
        region,             // 숫자 id (과거 방식)
      } = req.body || {};

      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: "NAME_REQUIRED" });
      }

      // region 확인(둘 다 지원)
      const regionId = await resolveRegionId({ regionSlug, region });
      if (!regionId) return res.status(400).json({ error: "REGION_REQUIRED" });

      // 비밀번호 해시(선택)
      let ownerPassHash = null;
      if (ownerPass && String(ownerPass).trim()) {
        ownerPassHash = await bcrypt.hash(String(ownerPass).trim(), 10);
      }

      // slug 결정: 제공되면 사용, 없으면 생성
      let slug = (providedSlug && String(providedSlug).trim()) || null;
      if (!slug) {
        const base = slugifyBase(name) || "place";
        // regionSlug가 있으면 prefix로 쓰고, 없으면 regionId만으로도 고유성 충분
        const prefix = regionSlug ? `${regionSlug}-` : "";
        slug = `${prefix}${base}`.slice(0, 80);
        let n = 0;
        // 고유 확보
        // eslint-disable-next-line no-await-in-loop
        while (await prisma.place.findUnique({ where: { slug } })) {
          n += 1;
          slug = `${prefix}${base}-${n}`;
        }
      }

      const place = await prisma.place.create({
        data: {
          name: String(name).trim(),
          slug,
          regionId,
          description: description ? String(description) : null,
          author: author ? String(author) : null,
          address: address ? String(address) : null,
          mapUrl: mapUrl ? String(mapUrl) : null,
          coverImage:
            coverImage && String(coverImage).trim()
              ? String(coverImage).trim()
              : null, // 선택
          ownerPassHash,
        },
        select: { id: true, slug: true },
      });

      return res.status(201).json({ ok: true, place });
    } catch (e) {
      console.error("Error creating place:", e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  // -------------------- 수정 --------------------
  if (req.method === "PUT") {
    try {
      const {
        id,            // 또는
        slug,          // ← 둘 중 하나로 대상 지정
        name,
        address,
        mapUrl,
        coverImage,
        description,
        author,
        ownerPass,     // 검증용
      } = req.body || {};

      const place = await findPlaceByIdOrSlug({ id, slug });
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });

      // 비밀번호 검증(기존 유지)
      const valid = await bcrypt.compare(
        String(ownerPass || ""),
        String(place.ownerPassHash || "")
      );
      if (!valid) return res.status(403).json({ error: "INVALID_PASSWORD" });

      await prisma.place.update({
        where: { id: place.id },
        data: {
          name: name ?? place.name,
          address: address ?? place.address,
          mapUrl: mapUrl ?? place.mapUrl,
          coverImage:
            coverImage !== undefined
              ? coverImage || null
              : place.coverImage,
          description: description ?? place.description,
          author: author ?? place.author,
        },
      });

      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("Error updating place:", e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  // -------------------- 삭제 --------------------
  if (req.method === "DELETE") {
    try {
      const { id, slug, ownerPass } = req.body || {};

      const place = await findPlaceByIdOrSlug({ id, slug });
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });

      const valid = await bcrypt.compare(
        String(ownerPass || ""),
        String(place.ownerPassHash || "")
      );
      if (!valid) return res.status(403).json({ error: "INVALID_PASSWORD" });

      await prisma.place.delete({ where: { id: place.id } });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("Error deleting place:", e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  res.setHeader("Allow", ["POST", "PUT", "DELETE"]);
  return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
                                   }
