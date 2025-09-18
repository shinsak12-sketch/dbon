// pages/_app.js
import "../styles/globals.css";
import { useRouter } from "next/router";
import { useState } from "react";

function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e) {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setQ("");
    }
  }

  return (
    <header className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
      {/* 홈 버튼 */}
      <a href="/" className="font-bold text-lg">
        디비슐랭
      </a>

      {/* 검색창 */}
      <form onSubmit={onSearch} className="flex gap-2 items-center">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="맛집 검색"
          className="px-2 py-1 rounded text-black w-40 sm:w-60"
        />
        <button
          type="submit"
          className="bg-white text-emerald-700 px-3 py-1 rounded font-semibold"
        >
          검색
        </button>
      </form>
    </header>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
