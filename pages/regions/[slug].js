import prisma from "../../lib/prisma";

export async function getServerSideProps({ params }) {
  const place = await prisma.place.findUnique({
    where: { slug: params.slug },
    include: { reviews: { orderBy: { createdAt: "desc" } } }
  });
  if (!place) return { notFound: true };
  return { props: { place } };
}

export default function PlaceDetail({ place }) {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-emerald-800">{place.name}</h1>
      <div className="flex items-center gap-4 mt-2">
        <span className="text-yellow-500 font-bold text-lg">★ {place.avgRating.toFixed(1)}</span>
        <span className="text-gray-500 text-sm">리뷰 {place.reviewsCount}개</span>
      </div>

      {/* 리뷰 리스트 */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">리뷰</h2>
        {place.reviews.length === 0 && (
          <p className="text-gray-500 mt-2">아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요!</p>
        )}
        <div className="mt-4 space-y-4">
          {place.reviews.map(r => (
            <div key={r.id} className="p-4 bg-white rounded-xl border shadow">
              <div className="flex items-center justify-between">
                <span className="text-yellow-500">★ {r.rating}</span>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("ko-KR")}</span>
              </div>
              <p className="mt-2 text-gray-700">{r.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 리뷰 작성 버튼 */}
      <div className="mt-10">
        <a
          href={`/places/${place.slug}/review`}
          className="px-6 py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
        >
          리뷰 작성하기
        </a>
      </div>
    </main>
  );
}
