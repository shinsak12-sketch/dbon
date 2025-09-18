// pages/regions/index.js
import Link from "next/link";
import prisma from "../../lib/prisma";

export async function getServerSideProps() {
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
  return { props: { regions } };
}

export default function Regions({ regions }) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-extrabold text-emerald-800">지역 선택</h1>
      <p className="text-gray-500 mt-1">보고 싶은 지역을 선택하세요</p>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {regions.map((r) => (
          <Link
            key={r.slug}
            href={`/regions/${r.slug}`}
            className="
              block rounded-xl border bg-white text-center
              shadow-sm hover:shadow transition
              px-3 py-3           /* ✅ 세로 여백 줄임 */
              text-lg font-semibold text-gray-800
            "
          >
            {r.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
