// pages/index.js
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  // Cloudinary 고정 public_id (관리자 업로드가 덮어쓰기 하는 대상)
  const baseUrl =
    cloud
      ? `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/landing/hero`
      : "";

  // 이미지 에러 시 플레이스홀더로 대체
  const [imgOk, setImgOk] = useState(Boolean(baseUrl));
  // 캐시 버스트(클라에서 1회성 쿼리 추가)
  const [burst, setBurst] = useState("");

  useEffect(() => {
    // 렌더 직후에만 한 번 쿼리 파라미터 추가 (CDN 잔여 캐시 방지)
    setBurst(`?t=${Date.now()}`);
  }, []);

  const heroUrl = useMemo(() => (imgOk ? `${baseUrl}${burst}` : ""), [imgOk, baseUrl, burst]);

  return (
    <main className="mx-auto max-w-4xl">
      {/* 히어로 영역 */}
      <section className="relative">
        {imgOk && baseUrl ? (
          <img
            src={heroUrl}
            alt="디비슐랭 메인 배경"
            className="h-56 w-full object-cover sm:h-72 md:h-80"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="h-56 sm:h-72 md:h-80 w-full flex items-center justify-center bg-gray-100 text-gray-500">
            등록된 배경 이미지가 없습니다
          </div>
        )}

        {/* 히어로 위 컨텐츠(타이틀/CTA) – 필요 없으면 삭제해도 됨 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <h1 className="px-4 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white drop-shadow">
            디비슐랭
          </h1>
          <p className="mt-2 px-4 text-sm sm:text-base text-white/90 drop-shadow">
            모두가 함께 만드는 동네 맛집 지도
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/regions/서울" // 실제 지역 슬러그로 바꿔 사용
              className="rounded-xl bg-emerald-700 px-4 py-2 text-white font-semibold hover:bg-emerald-800"
            >
              지역별 보기
            </Link>
            <Link
              href="/places/success" // 임시: 다른 페이지로 바꿔도 됨
              className="rounded-xl border px-4 py-2 font-semibold bg-white/90 hover:bg-white"
            >
              최근 등록 확인
            </Link>
          </div>
        </div>
      </section>

      {/* 본문(원하는 섹션 추가) */}
      <section className="p-6">
        <h2 className="text-lg font-semibold">지금 핫한 곳</h2>
        <p className="mt-2 text-gray-600">
          상단의 검색창이나 지역 페이지에서 맛집을 찾아보세요.
        </p>
      </section>
    </main>
  );
}
