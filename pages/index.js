import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 p-6 text-center">
      <div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">디비슐랭</h1>
        <p className="mt-4 text-lg text-gray-600">전국의 진짜 맛, 현장이 증명합니다.</p>
        <Link
          href="/regions"
          className="inline-block mt-8 px-8 py-3 rounded-xl bg-emerald-700 text-white font-semibold shadow hover:opacity-90 transition"
        >
          START
        </Link>
      </div>
    </main>
  );
}
