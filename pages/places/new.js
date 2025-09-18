// pages/places/new.js
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import prisma from "../../lib/prisma";
import Uploader from "../../components/Uploader";
import { useRouter } from "next/router";

// 서버에서 지역 목록
export async function getServerSideProps() {
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true },
  });
  return { props: { regions } };
}

// 간단 slugify (한글 허용 → 브라우저가 인코딩)
const slugify = (s = "") =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9가-힣\-]/g, "").replace(/\-+/g, "-") || "place";

export default function NewPlace({ regions }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [regionSlug, setRegionSlug] = useState(regions?.[0]?.slug || "");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 네이버 검색용 상태
  const [finderOpen, setFinderOpen] = useState(false);
  const [finderQuery, setFinderQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // 이름 입력 시 슬러그 자동 생성(표시는 안함, 내부에서만 사용)
  useEffect(() => setSlug(slugify(name)), [name]);

  const canSubmit = useMemo(
    () => !!name && !!regionSlug && !!coverImage && agree && !submitting,
    [name, regionSlug, coverImage, agree, submitting]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          regionSlug,
          address: address || null,
          mapUrl: mapUrl || null,
          coverImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "등록 실패");
        setSubmitting(false);
        return;
      }
      router.push(`/places/${data.slug}`);
    } catch (err) {
      console.error(err);
      setError("네트워크 오류");
      setSubmitting(false);
    }
  }

  // 네이버 검색 호출
  async function searchNaver() {
    const q = finderQuery.trim() || name.trim();
    if (!q) return;
    setLoadingSearch(true);
    try {
      const r = await fetch(`/api/naver/local?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setResults(data.items || []);
    } catch (e) {
      console.error(e);
      alert("네이버 검색 실패");
    } finally {
      setLoadingSearch(false);
    }
  }

  // 결과 선택 시 주소/지도 링크 채우기
  function choosePlace(item) {
    const addr = item.roadAddress || item.address || "";
    setAddress(addr);

    // 네이버 지도 링크 (검색 또는 링크 사용)
    const url =
      item.link ||
      `https://map.naver.com/v5/search/${encodeURIComponent(item.title)}`;
    setMapUrl(url);

    setFinderOpen(false);
  }

  return (
    <>
      <Head>
        <title>맛집 등록 — 디비슐랭</title>
      </Head>

      <main className="max-w-md mx-auto p-5">
        <h1 className="text-2xl font-extrabold">맛집 등록</h1>
        <p className="text-sm text-gray-500 mt-1">정확한 정보일수록 모두에게 도움이 됩니다 🙌</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* 가게명 */}
          <div>
            <label className="block text-sm font-medium">가게명 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 부대찌개대사관"
              className="mt-1 w-full border rounded-lg p-3"
              required
            />
          </div>

          {/* 지역 */}
          <div>
            <label className="block text-sm font-medium">지역 *</label>
            <select
              value={regionSlug}
              onChange={(e) => setRegionSlug(e.target.value)}
              className="mt-1 w-full border rounded-lg p-3 bg-white"
              required
            >
              {regions.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* 네이버에서 찾기 */}
          <div>
            <label className="block text-sm font-medium mb-1">주소/지도</label>
            <div className="flex gap-2">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="주소 (선택)"
                className="flex-1 border rounded-lg p-3"
              />
              <a
                href={mapUrl || "https://map.naver.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-gray-100 border"
              >
                지도열기
              </a>
            </div>
            <input
              type="url"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="네이버 지도 링크 (선택)"
              className="mt-2 w-full border rounded-lg p-3"
            />
            <button
              type="button"
              onClick={() => {
                setFinderQuery(name);
                setFinderOpen(true);
                setResults([]);
              }}
              className="mt-2 px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
            >
              네이버에서 찾기
            </button>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium mb-1">대표 이미지 *</label>
            <Uploader label="대표 이미지 선택" onUploaded={setCoverImage} />
            {!coverImage && (
              <p className="text-xs text-gray-500 mt-1">등록 전에 이미지를 업로드해주세요.</p>
            )}
          </div>

          {/* 동의 */}
          <div className="flex items-start gap-2">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="agree" className="text-sm text-gray-700">
              허위/무단 정보는 삭제될 수 있으며, 등록한 정보는 서비스 내에서 공개됩니다.
            </label>
          </div>

          {/* 에러 */}
          {error && <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

          {/* 제출 */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3 rounded-lg text-white font-semibold ${
              canSubmit ? "bg-emerald-700 hover:bg-emerald-800" : "bg-gray-400"
            }`}
          >
            {submitting ? "등록 중..." : "등록"}
          </button>
        </form>
      </main>

      {/* 🔍 네이버 장소 찾기 모달 */}
      {finderOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 border rounded-lg p-3"
                placeholder="가게명으로 검색"
                value={finderQuery}
                onChange={(e) => setFinderQuery(e.target.value)}
              />
              <button
                onClick={searchNaver}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-semibold"
                disabled={loadingSearch}
              >
                {loadingSearch ? "검색중..." : "검색"}
              </button>
            </div>

            <div className="mt-3 max-h-80 overflow-auto divide-y">
              {results.length === 0 && !loadingSearch && (
                <p className="text-sm text-gray-500 p-2">검색 결과가 없습니다.</p>
              )}
              {results.map((it, idx) => (
                <button
                  key={idx}
                  onClick={() => choosePlace(it)}
                  className="w-full text-left p-3 hover:bg-gray-50"
                >
                  <div className="font-medium">{it.title}</div>
                  <div className="text-xs text-gray-500">{it.category}</div>
                  <div className="text-sm text-gray-700">
                    {it.roadAddress || it.address}
                    {it.telephone ? ` · ${it.telephone}` : ""}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border"
                onClick={() => setFinderOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
