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

/** 이미지 입력 정규화: coverImages[] 우선, 없으면 coverImage 단일 → [] 변환 */
function normalizeCoverImages(body) {
  const { coverImages, coverImage } = body || {};
  if (Array.isArray(coverImages)) {
    return coverImages
      .map((u) => String(u || "").trim())
      .filter((u) => u.length > 0);
  }
  if (coverImage && String(coverImage).trim()) {
    return [String(coverImage).trim()];
  }
  return [];
}

/** 비번 입력 호환: ownerPass | password */
function getPasswordFromBody(body) {
  const { ownerPass, password } = body || {};
  return String(ownerPass ?? password ?? "");
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
        // 이미지: coverImages(권장) | coverImage(하위호환)
        // ownerPass(권장) | password(하위호환)
        slug: providedSlug, // 예전 API가 넘기던 값(있으면 그대로 사용)
        region,             // 숫자 id (과거 방식)
      } = req.body || {};

      if (!name || !String(name).trim()) {
  return res.status(400).json({ error: "NAME_REQUIRED" });
}

// ✅ 닉네임 필수
if (!author || !String(author).trim()) {
  return res.status(400).json({ error: "AUTHOR_REQUIRED" });
}

// region 확인(둘 다 지원)
const regionId = await resolveRegionId({ regionSlug, region });
if (!regionId) return res.status(400).json({ error: "REGION_REQUIRED" });

      // 비밀번호 해시(선택)
      const rawPass = getPasswordFromBody(req.body);
      let ownerPassHash = null;
      if (rawPass.trim()) {
        ownerPassHash = await bcrypt.hash(rawPass.trim(), 10);
      }

      // slug 결정: 제공되면 사용, 없으면 생성
      let slug = (providedSlug && String(providedSlug).trim()) || null;
      if (!slug) {
        const base = slugifyBase(name) || "place";
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

      // 이미지 정규화
      const imgs = normalizeCoverImages(req.body);

      const place = await prisma.place.create({
        data: {
          name: String(name).trim(),
          slug,
          regionId,
          description: description ? String(description) : null,
          author: author ? String(author) : null,
          address: address ? String(address) : null,
          mapUrl: mapUrl ? String(mapUrl) : null,
          // 🔥 다중 이미지 배열
          coverImages: imgs,
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
        description,
        author,
      } = req.body || {};

      const place = await findPlaceByIdOrSlug({ id, slug });
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });

      // 비밀번호 검증(소유자 보호)
      const rawPass = getPasswordFromBody(req.body);
      const hasHash = Boolean(place.ownerPassHash);
      if (!hasHash) {
        // 등록 당시 비번 미설정이라면 수정 불가로 막음
        return res.status(403).json({ error: "NO_PASSWORD_SET" });
      }
      const valid = await bcrypt.compare(String(rawPass || ""), String(place.ownerPassHash || ""));
      if (!valid) return res.status(403).json({ error: "INVALID_PASSWORD" });

      // 이미지 정규화(넘겨주면 갱신, 안 넘기면 그대로)
      let dataToUpdate = {
        name: name ?? place.name,
        address: address ?? place.address,
        mapUrl: mapUrl ?? place.mapUrl,
        description: description ?? place.description,
        author: author ?? place.author,
      };

      if ("coverImages" in req.body || "coverImage" in req.body) {
        dataToUpdate.coverImages = normalizeCoverImages(req.body);
      }

      await prisma.place.update({
        where: { id: place.id },
        data: dataToUpdate,
      });

      return res.status(200).json({ ok: true, slug: place.slug });
    } catch (e) {
      console.error("Error updating place:", e);
      return res.status(500).json({ error: "SERVER_ERROR" });
    }
  }

  // -------------------- 삭제 --------------------
  if (req.method === "DELETE") {
    try {
      const { id, slug } = req.body || {};

      const place = await findPlaceByIdOrSlug({ id, slug });
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });

      const rawPass = getPasswordFromBody(req.body);
      const hasHash = Boolean(place.ownerPassHash);
      if (!hasHash) {
        return res.status(403).json({ error: "NO_PASSWORD_SET" });
      }
      const valid = await bcrypt.compare(String(rawPass || ""), String(place.ownerPassHash || ""));
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
