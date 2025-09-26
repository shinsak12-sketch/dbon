// pages/regions/index.js
import prisma from "../../lib/prisma";
import Link from "next/link";

export async function getServerSideProps() {
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
  });
  return { props: { regions } };
}

export default function Regions({ regions }) {
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

      {regions.length === 0 && (
        <div className="mt-10 rounded-xl border p-6 bg-white">
          <p className="text-gray-600">
            등록된 지역이 없습니다. (DB에 Region 데이터를 먼저 넣어주세요)
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {regions.map((r) => (
          <Link
            key={r.id}
            href={`/regions/${r.slug}`}   // ✅ 지역 상세 페이지로 이동
            className="block rounded-2xl border bg-white px-4 py-6 text-center text-lg font-semibold hover:shadow"
          >
            {r.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
