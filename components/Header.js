// components/Header.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // 검색바는 "/" (랜딩)에서는 아예 숨김
  if (router.pathname === "/") return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-lg font-bold">
        디비슐랭
      </Link>

      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-white rounded-md overflow-hidden"
        style={{ height: "38px" }} // 검색창 전체 높이 고정
      >
        <input
          type="text"
          placeholder="맛집 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-3 text-gray-800 text-sm focus:outline-none"
          style={{ width: "180px", height: "100%" }} // 인풋 높이 버튼과 동일
        />
        <button
          type="submit"
          className="bg-emerald-600 text-white px-3 text-sm font-semibold hover:bg-emerald-700"
          style={{ height: "100%" }} // 버튼도 인풋과 높이 맞춤
        >
          검색
        </button>
      </form>
    </header>
  );
}
