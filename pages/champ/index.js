import Link from "next/link";

export default function ChampHome() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-emerald-800">디비온 챔피언십</h1>
        <Link href="/choose" className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-gray-50">
          ← 선택으로
        </Link>
      </header>

      <section className="mt-6 grid gap-4">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="font-semibold mb-2">시즌/대회</h2>
          <div className="flex gap-2">
            <Link href="/champ/seasons" className="rounded-xl border px-3 py-2 hover:bg-gray-50">시즌 보기</Link>
            <Link href="/champ/events" className="rounded-xl border px-3 py-2 hover:bg-gray-50">대회 보기</Link>
            <Link href="/champ/participate" className="rounded-xl bg-emerald-700 px-3 py-2 text-white font-semibold hover:bg-emerald-800">
              참가 등록
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h2 className="font-semibold mb-2">관리</h2>
          <Link href="/champ/admin" className="inline-block rounded-xl border px-3 py-2 hover:bg-gray-50">
            관리자 대시보드
          </Link>
        </div>
      </section>
    </main>
  );
}
