// pages/places/[slug]/index.js
import prisma from "../../../lib/prisma";
import Link from "next/link";

export async function getServerSideProps({ params }) {
  const region = await prisma.region.findUnique({
    where: { slug: params.slug },
    include: {
      places: { orderBy: { createdAt: "desc" } }, // 최신 등록순
    },
  });
  if (!region) return { notFound: true };
  return { props: { region } };
}

export default function RegionPlaces({ region }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-emerald-800">
          {region.name} 맛집
        </h1>
        <Link
          href={`/places/${region.slug}/new`}
          className="inline-block rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800"
        >
          맛집 등록하기
        </Link>
      </div>

      {region.places.length === 0 ? (
        <p className="mt-6 text-gray-500">아직 등록된 맛집이 없어요.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {region.places.map((place) => (
            <li key={place.id} className="rounded-2xl border bg-white hover:shadow">
              <Link
                // ✅ 상세는 단일 슬러그로 이동 (라우트 충돌 방지)
                href={`/places/${place.slug}`}
                className="block p-4 rounded-2xl hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{place.name}</span>
                  <span className="text-sm text-gray-500">
                    ★ {(place.avgRating ?? 0).toFixed(1)}
                  </span>
                </div>
                {place.address && (
                  <div className="mt-1 text-sm text-gray-600">{place.address}</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
