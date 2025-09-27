// pages/authors/[name].js
import prisma from "../../lib/prisma";
import Link from "next/link";

function pickThumb(p) {
  const arr = Array.isArray(p.coverImages) ? p.coverImages : [];
  const fromArray = arr.find((u) => /^https?:\/\/\S+/i.test(u));
  if (fromArray) return fromArray;
  if (p.coverImage && /^https?:\/\/\S+/i.test(p.coverImage)) return p.coverImage;
  return null;
}

export async function getServerSideProps({ params }) {
  const name = decodeURIComponent(params.name);

  const places = await prisma.place.findMany({
    where: { author: name },
    orderBy: [{ avgRating: "desc" }, { reviewsCount: "desc" }, { name: "asc" }],
    select: {
      id: true, name: true, slug: true,
      avgRating: true, reviewsCount: true,
      address: true, region: { select: { slug: true, name: true } },
      coverImages: true, coverImage: true,
    },
  });

  return { props: { name, places } };
}

export default function AuthorPlaces({ name, places }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-emerald-800">👤 {name} 님의 맛집</h1>
        <Link href="/regions" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          ← 지역 선택
        </Link>
      </div>

      {places.length === 0 ? (
        <p className="mt-6 text-gray-600">등록한 맛집이 없습니다.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {places.map((p) => {
            const thumb = pickThumb(p);
            return (
              <li key={p.id} className="flex items-center gap-4 rounded-xl border bg-white p-4">
                <div className="w-20 h-20 overflow-hidden rounded-lg border bg-gray-50">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={p.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <Link
                    href={`/places/${p.region.slug}/${p.slug}`}
                    className="text-lg font-semibold text-emerald-800"
                  >
                    {p.name}
                  </Link>
                  <div className="text-sm text-gray-600">
                    <span className="text-yellow-600 font-bold">
                      ★ {(p.avgRating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-gray-400"> · </span>
                    리뷰 {p.reviewsCount}개
                    {p.region?.name ? (
                      <>
                        <span className="text-gray-400"> · </span>
                        {p.region.name}
                      </>
                    ) : null}
                  </div>
                  {p.address ? (
                    <div className="text-sm text-gray-500 mt-1">{p.address}</div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
