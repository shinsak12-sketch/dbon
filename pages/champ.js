import Link from "next/link";

export default function Champ() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-teal-800">
            디비온 챔피언쉽
          </h1>
          <Link
            href="/choose"
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-white"
          >
            ← 선택으로
          </Link>
        </header>

        <section className="mt-8 rounded-2xl border bg-white p-8 shadow-sm">
          <p className="text-gray-700">
            스크린 골프 랭킹 화면을 준비 중입니다. 곧 시즌/랭킹/라운드 기록 등을
            이곳에 보여줄게요. 😊
          </p>
        </section>
      </div>
    </main>
  );
}
