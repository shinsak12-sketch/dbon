// components/Header.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const path = router.pathname || "";
  const isChamp = path.startsWith("/champ");

  // 랜딩 페이지("/")에서는 헤더 숨김
  if (path === "/") return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // 챔피언십 탭 활성 여부
  const inChampHome = path === "/champ";
  const inChampMe = path === "/champ/me";

  return (
    <header className="bg-emerald-800 text-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
        {/* 왼쪽 로고 */}
        {isChamp ? (
          // 👉 챔피언십 모드: 로고 누르면 항상 /champ
          <Link
            href="/champ"
            className="flex items-center gap-2 font-semibold tracking-tight hover:opacity-80 transition"
          >
            <span>DB ON Championship</span>
            <span role="img" aria-label="golf">
              🏌️‍♂️
            </span>
          </Link>
        ) : (
          // 👉 디비슐랭 모드
          <Link
            href="/"
            className="text-lg font-bold hover:opacity-80 transition"
          >
            디비슐랭
          </Link>
        )}

        {/* 오른쪽 영역 */}
        {isChamp ? (
          // ✅ 챔피언십 헤더: 내정보 / 선수등록 탭
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link
              href="/champ"
              className={
                "px-3 py-1.5 rounded-full " +
                (inChampHome
                  ? "bg-white text-emerald-800"
                  : "border border-white/70 text-white hover:bg-white/10")
              }
            >
              내정보
            </Link>
            <Link
              href="/champ/me"
              className={
                "px-3 py-1.5 rounded-full " +
                (inChampMe
                  ? "bg-yellow-400 text-emerald-900"
                  : "bg-yellow-300 text-emerald-900 hover:bg-yellow-400")
              }
            >
              선수등록
            </Link>
          </nav>
        ) : (
          // ✅ 디비슐랭 헤더: 검색창
          <form
            onSubmit={handleSubmit}
            className="flex items-center bg-white rounded-md overflow-hidden"
            style={{ height: "38px" }}
          >
            <input
              type="text"
              placeholder="맛집 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="px-3 text-gray-800 text-sm focus:outline-none"
              style={{ width: "180px", height: "100%" }}
            />
            <button
              type="submit"
              className="bg-emerald-600 text-white px-3 text-sm font-semibold hover:bg-emerald-700"
              style={{ height: "100%" }}
            >
              검색
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
