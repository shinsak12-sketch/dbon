// pages/regions/index.js
import prisma from "../../lib/prisma";
import Link from "next/link";

/** 유효 썸네일 선택 (배열 우선, 레거시 폴백) */
function pickThumb(p) {
  const arr = Array.isArray(p?.coverImages) ? p.coverImages : [];
  const fromArray = arr.find((u) => /^https?:\/\/\S+/i.test(u));
  if (fromArray) return fromArray;
  if (p?.coverImage && /^https?:\/\/\S+/i.test(p.coverImage)) return p.coverImage;
  return null;
}

export async function getServerSideProps() {
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  // 🔥 리뷰 많은 순 Top 3
  const top3 = await prisma.place.findMany({
    orderBy: [{ reviewsCount: "desc" }, { avgRating: "desc" }, { name: "asc" }],
    take: 3,
    select: {
      id: true,
      name: true,
      slug: true,
      reviewsCount: true,
      avgRating: true,
      coverImages: true,
      coverImage: true,
      region: { select: { slug: true, name: true } },
    },
  });

  // 👑 맛집왕 Top 3 (가장 많이 등록한 닉네임)
  const topAuthorsRaw = await prisma.place.groupBy({
    by: ["author"],
    where: { author: { not: null, not: "" } },
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
    take: 3,
  });

  // 각 닉네임의 대표 썸네일/지역 하나 가져오기(카드용)
  const topAuthors = await Promise.all(
    topAuthorsRaw.map(async (a) => {
      const anyPlace = await prisma.place.findFirst({
        where: { author: a.author },
        select: {
          region: { select: { name: true } },
          coverImages: true,
          coverImage: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return {
        author: a.author,
        count: a._count._all,
        regionName: anyPlace?.region?.name ?? null,
        thumb: pickThumb(anyPlace),
      };
    })
  );

  return { props: { regions, top3, topAuthors } };
}

export default function Regions({ regions, top3, topAuthors }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* 상단 제목 + 선택화면 버튼 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-emerald-800">지역 선택</h1>
        <Link
          href="/choose"
          className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          ← 선택으로
        </Link>
      </div>

      <p className="text-gray-500 mt-2">보고 싶은 지역을 선택하세요</p>

      {/* 🔥 리뷰 랭킹 Top3 */}
      {top3?.length > 0 && (
        <section className="mt-6 rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🔥</span>
            <h2 className="text-lg font-semibold">리뷰 TOP 3</h2>
          </div>
          <ul className="space-y-3">
            {top3.map((p, i) => {
              const thumb = pickThumb(p);
              return (
                <li key={p.id}>
                  <Link
                    href={`/places/${p.region.slug}/${p.slug}`}
                    className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50"
                  >
                    {/* 썸네일 */}
                    <div className="w-14 h-14 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : null}
                    </div>

                    {/* 텍스트 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{i + 1}위</span>
                        <h3 className="font-semibold">{p.name}</h3>
                        <span className="text-xs text-gray-500">· {p.region.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="text-yellow-600 font-semibold">
                          ★ {(p.avgRating ?? 0).toFixed(1)}
                        </span>
                        <span className="mx-1 text-gray-400">·</span>
                        <span>리뷰 {p.reviewsCount}개</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 👑 맛집왕 Top3 */}
      {topAuthors?.length > 0 && (
        <section className="mt-4 rounded-2xl border bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">👑</span>
            <h2 className="text-lg font-semibold">맛집왕 TOP 3</h2>
          </div>
          <ul className="space-y-3">
            {topAuthors.map((a, i) => (
              <li key={a.author + i} className="flex items-center gap-3 rounded-xl p-2">
                <div className="w-14 h-14 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                  {a.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.thumb} alt={a.author} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{i + 1}위</span>
                    <Link
                      href={`/authors/${encodeURIComponent(a.author)}`}
                      className="font-semibold text-emerald-800"
                    >
                      {a.author}
                    </Link>
                    {a.regionName ? (
                      <span className="text-xs text-gray-500">· {a.regionName} 등</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-gray-600">등록 {a.count}곳</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 지역 버튼 그리드 (크기 줄임) */}
      {regions.length === 0 ? (
        <div className="mt-10 rounded-xl border p-6 bg-white">
          <p className="text-gray-600">등록된 지역이 없습니다. (DB에 Region 데이터를 먼저 넣어주세요)</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {regions.map((r) => (
            <Link
              key={r.id}
              href={`/regions/${r.slug}`}
              className="block rounded-xl border bg-white px-4 py-5 text-center text-base font-semibold hover:shadow"
            >
              {r.name}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
        }
