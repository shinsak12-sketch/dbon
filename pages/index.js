import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white text-center px-6">
      <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg">
        DB ON
      </h1>
      <p className="mt-6 text-lg md:text-xl text-emerald-100">
        우리들의 이야기를 시작합니다
      </p>
      {/* START -> 중간 선택 페이지로 */}
      <Link
        href="/choose"
        className="inline-block mt-10 px-10 py-4 rounded-2xl bg-white text-emerald-700 font-bold shadow-xl hover:bg-emerald-50 hover:scale-105 transition transform"
      >
        START
      </Link>
    </main>
  );
}
