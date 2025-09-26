// pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [logoUrl, setLogoUrl] = useState("");
  const [showLogo, setShowLogo] = useState(true); // 이미지 로드 실패 시 숨김

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/background");
        const d = await r.json();
        setLogoUrl(d?.url || ""); // 저장된 URL 없으면 표시 X
      } catch {
        setLogoUrl("");
      }
    })();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white text-center px-6">
      {/* 로고(작게) - 타이틀 위 */}
      {logoUrl && showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt="랜딩 로고"
          className="w-28 h-28 md:w-32 md:h-32 object-contain mb-6 drop-shadow-xl rounded-xl"
          onError={() => setShowLogo(false)} // 404 등 실패 시 깔끔히 숨김
        />
      ) : null}

      <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg">
        DB ON
      </h1>
      <p className="mt-6 text-lg md:text-xl text-emerald-100">
        우리들의 이야기를 시작합니다.
      </p>
      <Link
        href="/regions"
        className="inline-block mt-10 px-10 py-4 rounded-2xl bg-white text-emerald-700 font-bold shadow-xl hover:bg-emerald-50 hover:scale-105 transition transform"
      >
        START
      </Link>
    </main>
  );
}
