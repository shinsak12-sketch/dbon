// pages/_app.js
import "../styles/globals.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { CHAMPIONSHIP_SEASON } from "../lib/constants"; // ✅ 시즌 텍스트 가져오기

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const path = router.pathname;

  const isLanding = path === "/";
  const isDBOn = path.startsWith("/regions") || path.startsWith("/places") || path.startsWith("/search");
  const isChamp = path.startsWith("/champ");

  // 검색창 상태 (디비슐랭 전용)
  const [q, setQ] = useState("");

  // 검색 실행
  const onSearch = () => {
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    setQ("");
  };

  return (
    <>
      {!isLanding && (
        <>
          {/* ✅ 디비슐랭 헤더 */}
          {isDBOn && (
            <header className="sticky top-0 z-40 bg-emerald-800 text-white">
              <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
                {/* ✅ 로고 클릭 → /choose 로 이동 */}
<Link href="/choose" className="font-extrabold text-xl whitespace-nowrap">
  DB ON
</Link>

                <div className="flex-1 flex items-center gap-2">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSearch()}
                    placeholder="맛집 검색"
                    className="w-full rounded-md bg-white/95 text-gray-900 px-3 py-2 focus:outline-none"
                  />
                  <button
                    onClick={onSearch}
                    className="shrink-0 rounded-md bg-emerald-700 hover:bg-emerald-600 px-3 py-2"
                  >
                    검색
                  </button>
                </div>
              </div>
            </header>
          )}

          {/* ✅ 챔피언십 헤더 */}
{isChamp && (
  <header className="sticky top-0 z-40 bg-emerald-800 text-white">
    <div className="mx-auto max-w-4xl px-4 py-3">
      {/* 상단 줄: 타이틀 */}
      <div className="flex items-center gap-2">
        <span className="font-extrabold text-lg flex-1">DB ON Championship 🏌️</span>
        {/* 데스크탑(>=sm): 오른쪽 버튼 한 줄 */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/champ/me"
            className="rounded-md bg-emerald-700 hover:bg-emerald-600 px-3 py-2 font-semibold"
          >
            내정보
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-yellow-400 text-black px-3 py-2 font-semibold hover:bg-yellow-300"
          >
            선수등록
          </Link>
        </div>
      </div>

      {/* 모바일(<sm): 버튼을 아래 줄로 */}
      <div className="mt-2 flex sm:hidden items-center gap-2">
        <Link
          href="/champ/me"
          className="flex-1 rounded-md bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 font-semibold text-sm text-center"
        >
          내정보
        </Link>
        <Link
          href="/register"
          className="flex-1 rounded-md bg-yellow-400 text-black px-3 py-1.5 font-semibold text-sm hover:bg-yellow-300 text-center"
        >
          선수등록
        </Link>
      </div>
    </div>
  </header>
)}
        </>
      )}

      <Component {...pageProps} />
    </>
  );
}
