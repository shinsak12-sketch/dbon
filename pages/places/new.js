import { useState, useEffect } from "react";

export default function NewPlace() {
  const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost");
  const initialRegion = url.searchParams.get("region") || "";

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [regionSlug, setRegionSlug] = useState(initialRegion);

  useEffect(() => {
    // 자동 슬러그 간단 생성
    setSlug(name.trim().toLowerCase().replace(/\s+/g, "-"));
  }, [name]);

  async function onSubmit(e) {
    e.preventDefault();
    const res = await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, regionSlug })
    });
    const data = await res.json();
    if (res.ok) {
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
          <input className="mt-1 w-full border rounded-lg p-3" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">주소 슬러그(자동)</label>
          <input className="mt-1 w-full border rounded-lg p-3" value={slug} onChange={e=>setSlug(e.target.value)} required />
          <p className="text-xs text-gray-500 mt-1">예: euljiro-naengmyeon</p>
        </div>
        <div>
          <label className="block text-sm font-medium">지역 슬러그</label>
          <input className="mt-1 w-full border rounded-lg p-3" value={regionSlug} onChange={e=>setRegionSlug(e.target.value)} required />
          <p className="text-xs text-gray-500 mt-1">예: seoul, busan, jeju ...</p>
        </div>
        <button className="w-full py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800">
          등록
        </button>
      </form>
    </main>
  );
}
