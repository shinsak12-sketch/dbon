import prisma from "../lib/prisma";

export async function getServerSideProps({ query }) {
  const q = (query.q || "").toString().trim();
  let results = [];
  if (q) {
    results = await prisma.place.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      orderBy: [{ avgRating: "desc" }, { reviewsCount: "desc" }],
      take: 30
    });
  }
  return { props: { q, results } };
}

export default function Search({ q, results }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-emerald-800">검색</h1>

      <form className="mt-4 flex gap-2" method="get" action="/search">
        <input
          name="q" defaultValue={q}
          className="flex-1 border rounded-lg p-3"
          placeholder="가게명으로 검색 (예: 냉면, 라멘)"
        />
        <button className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold">
          검색
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {q && <p className="text-gray-600">“{q}” 검색 결과: {results.length}건</p>}
        {results.map((p) => (
          <div key={p.id} className="p-4 bg-white rounded-xl border shadow">
            <div className="flex items-center justify-between">
              <a href={`/places/${p.slug}`} className="font-bold text-lg text-emerald-800 hover:underline">
                {p.name}
              </a>
              <span className="text-yellow-500 font-semibold">★ {p.avgRating?.toFixed(1) || "0.0"}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">리뷰 {p.reviewsCount}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
