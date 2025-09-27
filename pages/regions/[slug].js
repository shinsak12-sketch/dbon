// pages/regions/[slug].js
import prisma from "../../lib/prisma";
import Link from "next/link";

// 유효 썸네일 고르기 (배열 우선, 레거시 폴백)
function pickThumb(p) {
  const arr = Array.isArray(p.coverImages) ? p.coverImages : [];
  const fromArray = arr.find((u) => /^https?:\/\/+/i.test(u));
  if (fromArray) return fromArray;
  if (p.coverImage && /^https?:\/\/+/i.test(p.coverImage)) return p.coverImage;
  return null;
}

export async function getServerSideProps({ params }) {
  const region = await prisma.region.findUnique({
    where: { slug: params.slug },
  });

  if (!region) return { notFound: true };

  const places = await prisma.place.findMany({
    where: { regionId: region.id },
    orderBy: [
      { avgRating: "desc" },
      { reviewsCount: "desc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      avgRating: true,
      reviewsCount: true,
      address: true,
      // ✅ 썸네일용 필드 둘 다 가져오기
      coverImages: true,
      coverImage: true,
    },
  });

  return { props: { region, places } };
}

export default function RegionDetail({ region, places }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* 제목 + 버튼 */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-emerald-800">
          {region.name} 맛집
        </h1>
        <div className="flex gap-2">
          <Link
            href="/regions"
            className="shrink-0 rounded-xl border border-emerald-700 text-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-50"
          >
            지역 목록
          </Link>
          <Link
            href={`/places/${region.slug}/new`}
            className="shrink-0 rounded-xl bg-emerald-700 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-800"
          >
            맛집 등록하기
          </Link>
        </div>
      </div>

      {places.length === 0 && (
        <p className="mt-10 text-gray-600">아직 등록된 맛집이 없어요.</p>
      )}

      <div className="mt-6 grid gap-4">
        {places.map((p) => {
          const thumb = pickThumb(p);
          return (
            <Link
              key={p.id}
              href={`/places/${region.slug}/${p.slug}`}
              className="flex items-center gap-4 rounded-xl border bg-white p-4 hover:shadow"
            >
              {/* 썸네일 */}
              <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    No Image
                  </div>
                )}
              </div>

              {/* 텍스트 */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{p.name}</h2>
                  <span className="text-yellow-600 font-bold">
                    ★ {(p.avgRating ?? 0).toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    리뷰 {p.reviewsCount}개
                  </span>
                </div>
                {p.address && (
                  <p className="text-sm text-gray-500 mt-1">{p.address}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
