import Link from "next/link";

export default function Choose() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="max-w-xl mx-auto px-6 py-16">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-800">
            DB ON
          </h1>
          <p className="mt-2 text-gray-600">서비스를 선택하세요</p>
        </header>

        <div className="mt-10 grid gap-4">
          {/* ① 부서소식 */}
          <Link
            href="#"
            className="group block rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-emerald-800">부서소식</h2>
                <p className="mt-1 text-sm text-gray-600">
                  부서별 공지 및 업데이트
                </p>
              </div>
              <span className="rounded-xl bg-emerald-600/10 text-emerald-700 px-3 py-1 text-sm font-semibold">
                이동
              </span>
            </div>
          </Link>

          {/* ② 디비슐랭 */}
          <Link
            href="/regions"
            className="group block rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-emerald-800">디비슐랭</h2>
                <p className="mt-1 text-sm text-gray-600">
                  지역별 맛집 탐색 및 등록
                </p>
              </div>
              <span className="rounded-xl bg-emerald-600/10 text-emerald-700 px-3 py-1 text-sm font-semibold">
                이동
              </span>
            </div>
          </Link>

          {/* ③ 정보줍줍 */}
          <Link
            href="#"
            className="group block rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-emerald-800">정보줍줍</h2>
                <p className="mt-1 text-sm text-gray-600">
                  사내 꿀정보 & 자료 모아보기
                </p>
              </div>
              <span className="rounded-xl bg-emerald-600/10 text-emerald-700 px-3 py-1 text-sm font-semibold">
                이동
              </span>
            </div>
          </Link>

          {/* ④ 디비온 챔피언십 */}
          <Link
            href="/champ"
            className="group block rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-emerald-800">디비온 챔피언십</h2>
                <p className="mt-1 text-sm text-gray-600">
                  스크린골프 랭킹 및 리그 (준비 중)
                </p>
              </div>
              <span className="rounded-xl bg-emerald-600/10 text-emerald-700 px-3 py-1 text-sm font-semibold">
                이동
              </span>
            </div>
          </Link>

          {/* ⑤ 직원 경조사 */}
          <Link
            href="#"
            className="group block rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-emerald-800">직원 경조사</h2>
                <p className="mt-1 text-sm text-gray-600">
                  사내 경조사 소식과 안내
                </p>
              </div>
              <span className="rounded-xl bg-emerald-600/10 text-emerald-700 px-3 py-1 text-sm font-semibold">
                이동
              </span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
