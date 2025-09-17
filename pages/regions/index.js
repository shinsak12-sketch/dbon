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
  { name: "제주", slug: "jeju" },
];

export default function Regions() {
  return (
    <main style={{maxWidth: 960, margin: "0 auto", padding: 24}}>
      <h1 style={{fontSize: 28, fontWeight: 800}}>지역 선택</h1>
      <p style={{color:"#6b7280", marginTop: 6}}>보고 싶은 지역을 선택하세요.</p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12,
        marginTop: 24
      }}>
        {REGIONS.map(r => (
          <Link key={r.slug} href={`/regions/${r.slug}`} style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
            background: "#fff",
            textDecoration: "none",
            color: "#111827",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
          }}>
            {r.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
