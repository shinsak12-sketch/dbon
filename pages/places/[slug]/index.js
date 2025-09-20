// pages/places/[slug]/index.js
import prisma from "../../../lib/prisma";
import Link from "next/link";

export async function getServerSideProps(context) {
  const { slug } = context.params;

  const region = await prisma.region.findUnique({
    where: { slug },
    include: { places: true },
  });

  if (!region) return { notFound: true };

  return { props: { region } };
}

export default function RegionPlaces({ region }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-emerald-800 mb-4">
        {region.name} 맛집
      </h1>

      {/* ✅ 맛집 등록하기 버튼 */}
      <div className="mb-6">
        <Link
          href={`/places/${region.slug}/new`}
          className="inline-block rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800"
        >
          맛집 등록하기
        </Link>
      </div>

      {region.places.length === 0 ? (
        <p className="text-gray-500">아직 등록된 맛집이 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {region.places.map((place) => (
            <li key={place.id} className="border p-3 rounded hover:shadow">
              <Link
                href={`/places/${place.slug}`}
                className="font-medium text-emerald-700 hover:underline"
              >
                {place.name}
              </Link>
              {place.address && (
                <p className="text-sm text-gray-500">{place.address}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
