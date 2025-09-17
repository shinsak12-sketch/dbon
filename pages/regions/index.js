import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getServerSideProps() {
  const regions = await prisma.region.findMany();
  return { props: { regions } };
}

export default function Regions({ regions }) {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold">지역 선택</h1>
      <p className="text-gray-600 mt-2">보고 싶은 지역을 선택하세요.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
        {regions.map(r => (
          <a
            key={r.slug}
            href={`/regions/${r.slug}`}
            className="border rounded-xl p-4 text-center shadow-sm hover:shadow transition bg-white"
          >
            {r.name}
          </a>
        ))}
      </div>
    </main>
  );
}
