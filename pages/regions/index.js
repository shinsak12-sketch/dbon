import Link from "next/link";

const REGIONS = [
  { name: "서울", slug: "seoul" }, { name: "부산", slug: "busan" },
  { name: "대구", slug: "daegu" }, { name: "인천", slug: "incheon" },
  { name: "광주", slug: "gwangju" }, { name: "대전", slug: "daejeon" },
  { name: "울산", slug: "ulsan" }, { name: "세종", slug: "sejong" },
  { name: "경기", slug: "gyeonggi" }, { name: "강원", slug: "gangwon" },
  { name: "충북", slug: "chungbuk" }, { name: "충남", slug: "chungnam" },
  { name: "전북", slug: "jeonbuk" }, { name: "전남", slug: "jeonnam" },
  { name: "경북", slug: "gyeongbuk" }, { name: "경남", slug: "gyeongnam" },
  { name: "제주", slug: "jeju" }
];

export default function Regions() {
  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold text-emerald-800">지역 선택</h1>
      <p className="text-gray-600 mt-2">보고 싶은 지역을 선택하세요</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 mt-10">
        {REGIONS.map(r => (
          <Link
            key={r.slug}
            href={`/regions/${r.slug}`}
            className="p-6 rounded-2xl bg-white border border-gray-200 shadow hover:shadow-lg hover:bg-emerald-50 hover:scale-105 transition transform text-center font-semibold"
          >
            {r.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
