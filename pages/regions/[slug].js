// pages/regions/[slug].js
import prisma from "../../lib/prisma";

export async function getServerSideProps({ params, query }) {
  const sort = query.sort || "rating"; // rating | reviews | name

  const region = await prisma.region.findUnique({
    where: { slug: params.slug }
  });
  if (!region) return { notFound: true };

  const orderBy =
    sort === "reviews"
      ? [{ reviewsCount: "desc" }, { avgRating: "desc" }]
      : sort === "name"
      ? { name: "asc" }
      : [{ avgRating: "desc" }, { reviewsCount: "desc" }]; // rating(기본)

  const places = await prisma.place.findMany({
    where: { regionId: region.id },
    orderBy
  });

  return { props: { region, places, sort } };
}

function SortTabs({ regionSlug, sort }) {
  const base = `/regions/${regionSlug}`;
  const btn = (label, key) => (
    <a
      key={key}
      href={`${base}?sort=${key}`}
      className={`px-3 py-2 rounded-lg border text-sm ${
        sort === key
          ? "bg-emerald-700 text-white border-emerald-700"
          : "bg-white text-gray-700 border-gray-200 hover:bg-emerald-50"
      }`}
    >
      {label}
    </a>
  );
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {btn("평점순", "rating")}
      {btn("리뷰많은순", "reviews")}
      {btn("이름순", "name")}
    </div>
  );
}

export default function RegionBoard({ region, places, sort }) {
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

      {/* 정렬 탭 */}
      <SortTabs regionSlug={region.slug} sort={sort} />

      <div className="mt-6 space-y-5">
        {places.length === 0 && (
          <div className="text-gray-500">아직 등록된 맛집이 없어요. 첫 번째로 올려보세요!</div>
        )}
        {places.map((p) => (
          <div key={p.id} className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <a
                href={`/places/${p.slug}`}
                className="font-bold text-lg text-emerald-800 hover:underline"
              >
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
