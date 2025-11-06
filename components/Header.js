import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // 챔피언십 경로 감지
  const isChamp = router.pathname.startsWith("/champ");

  // 랜딩 페이지("/")에서는 헤더 숨김
  if (router.pathname === "/") return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };
 
  return (
    <header className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
      {/* 왼쪽 로고 */}
      {isChamp ? (
        <Link
          href="/champ"
          className="text-lg font-bold hover:opacity-80 transition"
        >
          DB ON Championship 🏌️
        </Link>
      ) : (
        <Link href="/" className="text-lg font-bold hover:opacity-80 transition">
          디비슐랭
        </Link>
      )}

      {/* 검색창은 챔피언십 페이지에선 제거 */}
      {!isChamp && (
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
    </header>
  );
}
