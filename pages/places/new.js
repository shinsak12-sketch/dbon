// pages/places/new.js
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import prisma from "../../lib/prisma";
import Uploader from "../../components/Uploader";
import { useRouter } from "next/router";

// --- 서버에서 지역 목록 불러오기 ---
export async function getServerSideProps() {
  const regions = await prisma.region.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return { props: { regions } };
}

// 한글/특수문자 포함 이름을 URL용으로 만들기
function slugify(input) {
  // 1) 소문자
  let s = (input || "").toLowerCase().trim();
  // 2) 공백 -> 하이픈
  s = s.replace(/\s+/g, "-");
  // 3) 영문/숫자/한글/하이픈만 남기기
  s = s.replace(/[^a-z0-9가-힣\-]/g, "");
  // 4) 하이픈 연속 정리
  s = s.replace(/\-+/g, "-");
  // 5) 빈 값이면 랜덤붙이기
  if (!s) s = "place-" + Math.random().toString(36).slice(2, 7);
  return s;
}

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

  // 가게명 입력 시 슬러그 자동생성 (직접 수정하면 자동 덮어쓰지 않음)
  useEffect(() => {
    if (!name) return setSlug("");
    setSlug((prev) => {
      const auto = slugify(name);
      // 사용자가 직접 편집한 흔적(이전 값이 자동 생성값이 아니면) 보존
      if (!prev || prev.startsWith(slugify(prev)) || prev === slugify(prev)) return auto;
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const canSubmit = useMemo(() => {
    return !!name && !!slug && !!regionSlug && !!coverImage && agree && !submitting;
  }, [name, slug, regionSlug, coverImage, agree, submitting]);

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
          slug: slugify(slug),
          regionSlug,
          address: address.trim() || null,
          mapUrl: mapUrl.trim() || null,
          coverImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "등록에 실패했습니다.");
        setSubmitting(false);
        return;
      }
      // 상세 페이지로 이동
      router.push(`/places/${data.slug}`);
    } catch (err) {
      console.error(err);
      setError("네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>맛집 등록 — 디비슐랭</title>
      </Head>

      <main className="max-w-md mx-auto p-5">
        <h1 className="text-2xl font-extrabold">맛집 등록</h1>
        <p className="text-sm text-gray-500 mt-1">
          정확한 정보일수록 다른 이용자에게 도움이 됩니다 🙌
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* 가게명 */}
          <div>
            <label className="block text-sm font-medium">가게명 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 을지로 냉면"
              className="mt-1 w-full border rounded-lg p-3"
              required
            />
          </div>

          {/* 슬러그 (자동 생성, 수정 가능) */}
          <div>
            <label className="block text-sm font-medium">
              주소용 이름(슬러그) *
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full border rounded-lg p-3"
              placeholder="예) euljiro-naengmyeon"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              최종 주소: <span className="font-mono">/places/{slug || "…"}</span>
            </p>
          </div>

          {/* 지역 선택 */}
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

          {/* 주소/지도(선택) */}
          <div>
            <label className="block text-sm font-medium">주소 (선택)</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예) 서울 중구 을지로 ○○-○"
              className="mt-1 w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">지도 링크 (선택)</label>
            <input
              type="url"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://map.naver.com/…"
              className="mt-1 w-full border rounded-lg p-3"
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium mb-1">대표 이미지 *</label>
            <Uploader label="대표 이미지 선택" onUploaded={setCoverImage} />
            {!coverImage && (
              <p className="text-xs text-gray-500 mt-1">등록 전에 이미지를 업로드해주세요.</p>
            )}
          </div>

          {/* 동의 체크 */}
          <div className="flex items-start gap-2">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="agree" className="text-sm text-gray-700">
              허위/무단 콘텐츠는 예고 없이 삭제될 수 있으며, 등록한 정보는 서비스 내에서 공개됩니다.
            </label>
          </div>

          {/* 에러 표시 */}
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
          )}

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

          {/* 뒤로가기 */}
          <div className="text-center">
            <a href={`/regions/${regionSlug || ""}`} className="text-sm text-gray-500 underline">
              ← 지역 목록으로
            </a>
          </div>
        </form>
      </main>
    </>
  );
}
