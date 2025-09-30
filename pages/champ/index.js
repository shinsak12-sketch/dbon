// pages/champ/index.js
import Link from "next/link";

export default function ChampHome() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-emerald-800">디비온 챔피언십</h1>
        <Link
          href="/choose"
          className="rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
        >
          ← 선택으로
        </Link>
      </header>

      {/* 시즌/대회 섹션만 남김 */}
      <section className="card">
        <div className="card-body">
          <h2 className="text-xl font-bold mb-4">시즌/대회</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/champ/seasons" className="btn btn-outline">시즌 보기</Link>
            <Link href="/champ/events" className="btn btn-outline">대회 보기</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
