// pages/places/[slug].js
import prisma from "../../lib/prisma";

export async function getServerSideProps({ params }) {
  const place = await prisma.place.findUnique({
    where: { slug: params.slug },
    include: {
      reviews: { orderBy: { createdAt: "desc" } }, // 리뷰 최신순
    },
  });
  if (!place) return { notFound: true };
  return { props: { place } };
}

export default function PlaceDetail({ place }) {
  return (
    <main className="max-w-2xl mx-auto p-6">
      {/* 가게 이름 + 평점 */}
      <h1 className="text-3xl font-extrabold text-emerald-800">{place.name}</h1>
      <div className="flex items-center gap-4 mt-2">
        <span className="text-yellow-500 font-bold text-lg">
          ★ {place.avgRating.toFixed(1)}
        </span>
        <span className="text-gray-500 text-sm">리뷰 {place.reviewsCount}개</span>
      </div>

      {/* ✅ 대표 이미지 */}
      {place.coverImage && (
        <div className="mt-4">
          <img
            src={place.coverImage}
            alt={place.name}
            className="w-full rounded-xl border"
          />
        </div>
      )}

      {/* 주소 / 지도 링크 */}
      {(place.address || place.mapUrl) && (
        <div className="mt-6">
          {place.address && <p className="text-gray-700">📍 {place.address}</p>}
          {place.mapUrl && (
            <a
              href={place.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline text-sm"
            >
              지도에서 보기
            </a>
          )}
        </div>
      )}

      {/* 리뷰 섹션 */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">리뷰</h2>
        {place.reviews.length === 0 && (
          <p className="text-gray-500 mt-2">
            아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요!
          </p>
        )}
        <div className="mt-4 space-y-4">
          {place.reviews.map((r) => (
            <div key={r.id} className="p-4 bg-white rounded-xl border shadow">
              <div className="flex items-center justify-between">
                <span className="text-yellow-500">★ {r.rating}</span>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>

              {/* 닉네임 */}
              {r.author && (
                <p className="text-sm text-gray-500 mt-1">— {r.author}</p>
              )}

              {/* 리뷰 이미지 */}
              {r.imageUrl && (
                <div className="mt-2">
                  <img
                    src={r.imageUrl}
                    alt="review"
                    className="w-full rounded-lg border"
                  />
                </div>
              )}

              {/* 내용 */}
              <p className="mt-2 text-gray-700 whitespace-pre-line">{r.content}</p>

              {/* 수정/삭제 링크 (라우트는 나중에 구현 예정이면 숨겨도 됨) */}
              <div className="mt-3 flex gap-3 text-sm">
                <a
                  href={`/reviews/${r.id}/edit`}
                  className="text-emerald-700 underline"
                >
                  수정
                </a>
                <a
                  href={`/reviews/${r.id}/delete`}
                  className="text-red-600 underline"
                >
                  삭제
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 리뷰 작성하기 버튼 */}
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
