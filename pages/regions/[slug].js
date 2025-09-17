import { useRouter } from "next/router";

export default function RegionBoard() {
  const { query } = useRouter();
  const slug = (query.slug || "").toString();

  const DUMMY_LIST = [
    { id: 1, name: "을지로 냉면집", rating: 4.7, tags: ["냉면","노포"], saves: 120, comments: 45 },
    { id: 2, name: "망원동 라멘", rating: 4.5, tags: ["라멘"], saves: 98, comments: 31 },
    { id: 3, name: "연남 파스타", rating: 4.3, tags: ["파스타","데이트"], saves: 76, comments: 22 }
  ];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-emerald-800">
        {slug.toUpperCase()} 지역 맛집
      </h1>

      {/* 필터바 */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button className="px-4 py-2 rounded-lg bg-white border border-gray-200 shadow hover:bg-emerald-50">
          카테고리
        </button>
        <button className="px-4 py-2 rounded-lg bg-white border border-gray-200 shadow hover:bg-emerald-50">
          정렬: 최신
        </button>
        <button className="px-4 py-2 rounded-lg bg-white border border-gray-200 shadow hover:bg-emerald-50">
          검색
        </button>
      </div>

      {/* 리스트 */}
      <div className="mt-8 space-y-5">
        {DUMMY_LIST.map(item => (
          <div
            key={item.id}
            className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{item.name}</h2>
              <span className="text-yellow-500 font-semibold">★ {item.rating.toFixed(1)}</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              #{item.tags.join(" #")}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              저장 {item.saves} · 댓글 {item.comments}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
