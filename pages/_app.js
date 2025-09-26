// pages/_app.js
import "../styles/globals.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // ✅ 디비슐랭 영역에서만 헤더 표시
  const showSearchHeader =
    router.pathname.startsWith("/regions") ||
    router.pathname.startsWith("/places");

  // 검색창 상태
  const [q, setQ] = useState("");

  // 검색 실행
  const onSearch = () => {
    const keyword = q.trim();
    if (!keyword) return;
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
    setQ("");
  };

  return (
    <>
      {showSearchHeader && (
        <header className="sticky top-0 z-40 bg-emerald-800 text-white">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
            {/* ✅ 로고 클릭 → /regions 이동 (디비슐랭 홈) */}
            <Link href="/regions" className="font-extrabold text-xl whitespace-nowrap">
              디비슐랭
            </Link>

            {/* 검색바 */}
            <div className="flex-1 flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder="맛집 검색"
                className="w-full rounded-md bg-white/95 text-gray-900 px-3 py-2 focus:outline-none"
                aria-label="맛집 검색"
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

      <Component {...pageProps} />
    </>
  );
}
