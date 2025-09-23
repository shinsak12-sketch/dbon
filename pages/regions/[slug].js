// pages/regions/[slug].js
import prisma from "../../lib/prisma";
import Link from "next/link";

export async function getServerSideProps({ params }) {
  const region = await prisma.region.findUnique({
    where: { slug: params.slug },
  });

  if (!region) return { notFound: true };

  const places = await prisma.place.findMany({
    where: { regionId: region.id },
    orderBy: [{ avgRating: "desc" }, { reviewsCount: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      avgRating: true,
      reviewsCount: true,
      coverImage: true,
      address: true,
    },
  });

  return { props: { region, places } };
}

export default function RegionDetail({ region, places }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-emerald-800">
        {region.name} 맛집
      </h1>

      {/* 등록 버튼 */}
      <div className="mt-4">
        <Link
          href={`/places/${region.slug}/new`}
          className="inline-block rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800"
        >
          맛집 등록하기
        </Link>
      </div>

      {/* 비어있을 때 안내 */}
      {places.length === 0 && (
        <p className="mt-10 text-gray-600">아직 등록된 맛집이 없어요.</p>
      )}

      {/* 맛집 카드 리스트 */}
      <div className="mt-6 grid gap-4">
        {places.map((p) => (
          <Link
            key={p.id}
            href={`/places/${region.slug}/${p.slug}`} // ✅ 지역/맛집 2단계 경로
            className="flex items-center gap-4 rounded-xl border bg-white p-4 hover:shadow"
          >
            {/* 썸네일 */}
            <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-50">
              {p.coverImage ? (
                <img
                  src={p.coverImage}
                  alt={p.name}
                  className="w-full h-full object-cover"
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
                  ★ {p.avgRating?.toFixed(1) ?? "0.0"}
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
        ))}
      </div>
    </main>
  );
}
