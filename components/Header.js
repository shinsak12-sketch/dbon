// components/Header.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // 랜딩(/)에서는 검색창 숨김
  const hideSearch = router.pathname === "/";

  return (
    <header className="bg-emerald-700 text-white p-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        디비슐랭
      </Link>

      {!hideSearch && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="맛집 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-2 py-1 rounded text-black"
          />
          <button
            type="submit"
            className="bg-white text-emerald-700 px-3 py-1 rounded"
          >
            검색
          </button>
        </form>
      )}
    </header>
  );
}
