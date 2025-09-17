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
      <h1 className="text-2xl font-bold">{slug.toUpperCase()} 지역 맛집</h1>

      <div className="flex flex-wrap gap-2 mt-4">
        <button className="px-3 py-1 border rounded-lg bg-white">카테고리</button>
        <button className="px-3 py-1 border rounded-lg bg-white">정렬: 최신</button>
        <button className="px-3 py-1 border rounded-lg bg-white">검색</button>
      </div>

      <div className="mt-6 space-y-3">
        {DUMMY_LIST.map(item => (
          <div key={item.id} className="p-4 bg-white border rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{item.name}</div>
              <div className="text-sm">★ {item.rating.toFixed(1)}</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">#{item.tags.join(" #")}</div>
            <div className="text-xs text-gray-500 mt-1">
              저장 {item.saves} · 댓글 {item.comments}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
