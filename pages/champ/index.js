import Link from "next/link";

export default function ChampHome() {
  return (
    <main className="min-h-screen bg-emerald-50">
      {/* 헤더/히어로: 상단 우측 CTA만 유지 */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">DB ON Championship 🏌️</h1>
          {/* ✅ 참가하기: 참가 등록 페이지로 바로 이동 */}
          <Link
            href="/champ/participants/new"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-extrabold text-gray-900 hover:bg-yellow-300"
          >
            참가하기
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10">
        <header className="flex items-center justify-between mt-6">
          <h2 className="text-3xl font-extrabold text-emerald-800">디비온 챔피언쉽</h2>
          <Link
            href="/choose"
            className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            ← 선택으로
          </Link>
        </header>

        {/* 섹션: 시즌/대회 (중간 ‘참가 등록’ 버튼 제거) */}
        <section className="mt-6 rounded-2xl border bg-white p-4">
          <h3 className="text-lg font-semibold mb-3">시즌/대회</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/champ/seasons"
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              시즌 보기
            </Link>
            <Link
              href="/champ/events"
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              대회 보기
            </Link>
            {/* ❌ 참가 등록 버튼은 삭제했습니다 */}
          </div>
        </section>

        {/* 관리 섹션 (기존 유지) */}
        <section className="mt-6 rounded-2xl border bg-white p-4">
          <h3 className="text-lg font-semibold mb-3">관리</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/champ/admin"
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              관리자 대시보드
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
