// pages/champ/index.js
import Link from "next/link";

export default function ChampHome() {
  return (
    <main className="min-h-screen bg-emerald-50">
      {/* ✅ 상단 배너 제거 — 전역(_app.js)에서만 렌더되도록 */}

      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-extrabold text-emerald-900">디비온 챔피언십</h2>
          <Link
            href="/choose"
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-white"
          >
            ← 선택으로
          </Link>
        </header>

        {/* 시즌/대회 */}
        <section className="rounded-2xl border bg-white p-5 mb-6">
          <h3 className="text-lg font-bold mb-3">시즌/대회</h3>
          <div className="flex gap-3">
            <Link
              href="/champ/seasons"
              className="rounded-xl border px-4 py-2 text-emerald-800 font-semibold hover:bg-gray-50"
            >
              시즌 보기
            </Link>
            <Link
              href="/champ/events"
              className="rounded-xl border px-4 py-2 text-emerald-800 font-semibold hover:bg-gray-50"
            >
              대회 보기
            </Link>
          </div>
        </section>

        {/* 관리 */}
        <section className="rounded-2xl border bg-white p-5">
          <h3 className="text-lg font-bold mb-3">관리</h3>
          <Link
            href="/champ/admin"
            className="inline-block rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
          >
            관리자 대시보드
          </Link>
        </section>
      </div>
    </main>
  );
}
