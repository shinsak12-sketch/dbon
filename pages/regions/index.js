import prisma from "../../lib/prisma";

export async function getServerSideProps() {
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" }
  });
  return { props: { regions } };
}

export default function Regions({ regions }) {
  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold text-emerald-800">지역 선택</h1>
      <p className="text-gray-600 mt-2">보고 싶은 지역을 선택하세요</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mt-10">
        {regions.map(r => (
          <a
            key={r.slug}
            href={`/regions/${r.slug}`}
            className="p-6 rounded-2xl bg-white border border-gray-200 shadow hover:shadow-lg hover:bg-emerald-50 hover:scale-105 transition text-center font-semibold"
          >
            {r.name}
          </a>
        ))}
      </div>
    </main>
  );
}
