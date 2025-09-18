// pages/places/new.js
import { useEffect, useState } from "react";

export async function getServerSideProps({ query }) {
  // /places/new?region=seoul 처럼 들어오면 기본값으로 세팅
  const initialRegion = (query.region || "").toString();
  return { props: { initialRegion } };
}

export default function NewPlace({ initialRegion }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [regionSlug, setRegionSlug] = useState(initialRegion || "");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  // 가게명 입력 시 slug 자동 생성
  useEffect(() => {
    const s = name
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    if (!slug || slug.startsWith(s.slice(0, slug.length))) setSlug(s);
  }, [name]); // eslint-disable-line

  async function onSubmit(e) {
    e.preventDefault();
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, regionSlug, address, mapUrl })
    });
    const data = await res.json();
    if (res.ok) {
      // 등록 성공 → 지역 목록으로 이동
      window.location.href = `/regions/${regionSlug}`;
    } else {
      alert(data.error || "등록 실패");
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">맛집 등록</h1>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium">가게명</label>
          <input
            className="mt-1 w-full border rounded-lg p-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 을지로 냉면집"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">슬러그(URL)</label>
          <input
            className="mt-1 w-full border rounded-lg p-3"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="예: euljiro-naengmyeon"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            주소 예: <code>/places/euljiro-naengmyeon</code>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">지역 슬러그</label>
          <input
            className="mt-1 w-full border rounded-lg p-3"
            value={regionSlug}
            onChange={(e) => setRegionSlug(e.target.value)}
            placeholder="예: seoul, busan, jeju ..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">주소</label>
          <input
            className="mt-1 w-full border rounded-lg p-3"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="예: 서울 중구 을지로 12-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">지도 링크</label>
          <input
            type="url"
            className="mt-1 w-full border rounded-lg p-3"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="예: https://map.naver.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            네이버/카카오/구글 지도 공유 링크를 붙여넣으세요.
          </p>
        </div>

        <button className="w-full py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800">
          등록
        </button>
      </form>

      <div className="mt-6 text-center">
        <a href={`/regions/${regionSlug || ""}`} className="text-sm text-gray-500 underline">
          ← 지역 목록으로
        </a>
      </div>
    </main>
  );
}
