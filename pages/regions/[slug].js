// pages/regions/[slug].js
import prisma from "../../lib/prisma";

export async function getServerSideProps({ params }) {
  const region = await prisma.region.findUnique({
    where: { slug: params.slug }
  });
  if (!region) return { notFound: true };

  const places = await prisma.place.findMany({
    where: { regionId: region.id },
    orderBy: [{ avgRating: "desc" }, { reviewsCount: "desc" }]
  });

  return { props: { region, places } };
}

export default function RegionBoard({ region, places }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-extrabold text-emerald-800">
          {region.name} 지역 맛집
        </h1>
        <a
          href={`/places/new?region=${region.slug}`}
          className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
        >
          맛집 등록
        </a>
      </div>

      <div className="mt-6 space-y-5">
        {places.length === 0 && (
          <div className="text-gray-500">아직 등록된 맛집이 없어요. 첫 번째로 올려보세요!</div>
        )}
        {places.map(p => (
          <div key={p.id} className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <a href={`/places/${p.slug}`} className="font-bold text-lg text-emerald-800 hover:underline">
                {p.name}
              </a>
              <span className="text-yellow-500 font-semibold">
                ★ {p.avgRating?.toFixed(1) || "0.0"}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">리뷰 {p.reviewsCount}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
