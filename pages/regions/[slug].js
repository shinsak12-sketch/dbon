// pages/regions/[slug].js
import prisma from "../../lib/prisma";
import Link from "next/link";

export async function getServerSideProps({ params }) {
  const region = await prisma.region.findUnique({
    where: { slug: params.slug },
    include: {
      places: { orderBy: { name: "asc" } }, // 이 지역의 가게 목록
    },
  });

  if (!region) return { notFound: true };
  return { props: { region } };
}

export default function RegionDetail({ region }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-emerald-800">
        {region.name} 맛집
      </h1>

      {region.places.length === 0 ? (
        <p className="mt-6 text-gray-500">아직 등록된 맛집이 없어요.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {region.places.map((p) => (
            <li key={p.id} className="border rounded-xl p-4 hover:bg-gray-50">
              <Link href={`/places/${p.slug}`} className="font-semibold">
                {p.name}
              </Link>
              {p.address && (
                <div className="text-sm text-gray-500 mt-1">{p.address}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
