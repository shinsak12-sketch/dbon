// pages/index.js
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [bg, setBg] = useState("");

  useEffect(() => {
    fetch("/api/admin/background")
      .then(r => r.json())
      .then(d => setBg(d?.url || ""))
      .catch(() => {});
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-white text-center px-6"
      style={{
        backgroundImage: bg
          ? `linear-gradient(135deg, rgba(16,185,129,.85), rgba(13,148,136,.85)), url(${bg})`
          : "linear-gradient(135deg, #059669, #0f766e)",
        backgroundSize: bg ? "cover" : "auto",
        backgroundPosition: "center",
      }}
    >
      <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg">
        디비슐랭
      </h1>
      <p className="mt-6 text-lg md:text-xl text-emerald-100">
        전국의 진짜 맛, 현장이 증명합니다.
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
