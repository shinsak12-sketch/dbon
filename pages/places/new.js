// pages/places/new.js
import { useEffect, useState } from "react";
import Uploader from "../../components/Uploader";

export async function getServerSideProps({ query }) {
  const initialRegion = (query.region || "").toString();
  return { props: { initialRegion } };
}

export default function NewPlace({ initialRegion }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [regionSlug, setRegionSlug] = useState(initialRegion || "");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");

  useEffect(() => {
    const s = name.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
    if (!slug || slug.startsWith(s.slice(0, slug.length))) setSlug(s);
  }, [name]); // eslint-disable-line

  async function onSubmit(e) {
    e.preventDefault();
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, regionSlug, address, mapUrl, coverImage })
    });
    const data = await res.json();
    if (res.ok) window.location.href = `/regions/${regionSlug}`;
    else alert(data.error || "등록 실패");
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">맛집 등록</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium">가게명</label>
          <input className="mt-1 w-full border rounded-lg p-3" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">슬러그(URL)</label>
          <input className="mt-1 w-full border rounded-lg p-3" value={slug} onChange={e=>setSlug(e.target.value)} required />
          <p className="text-xs text-gray-500 mt-1">예: /places/euljiro-naengmyeon</p>
        </div>
        <div>
          <label className="block text-sm font-medium">지역 슬러그</label>
          <input className="mt-1 w-full border rounded-lg p-3" value={regionSlug} onChange={e=>setRegionSlug(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">주소</label>
          <input className="mt-1 w-full border rounded-lg p-3" value={address} onChange={e=>setAddress(e.target.value)} placeholder="서울 중구 ..." />
        </div>
        <div>
          <label className="block text-sm font-medium">지도 링크</label>
          <input type="url" className="mt-1 w-full border rounded-lg p-3" value={mapUrl} onChange={e=>setMapUrl(e.target.value)} placeholder="https://map.naver.com/..." />
        </div>

        {/* 대표 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium mb-1">대표 이미지</label>
          <Uploader label="대표 이미지 선택" onUploaded={setCoverImage} />
          {coverImage && <p className="text-xs text-gray-500 mt-1">업로드 완료</p>}
        </div>

        <button className="w-full py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800">
          등록
        </button>
      </form>

      <div className="mt-6 text-center">
        <a href={`/regions/${regionSlug || ""}`} className="text-sm text-gray-500 underline">← 지역 목록으로</a>
      </div>
    </main>
  );
          }
