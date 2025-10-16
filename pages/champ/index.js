// pages/champ/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());
const A = (x) => (Array.isArray(x) ? x : []);

export default function ChampHome() {
  const { data, error, isLoading } = useSWR("/api/champ/home", fetcher, { revalidateOnFocus: false });
  const ev = data?.currentEvent ?? null;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-8">
      {isLoading && <div className="rounded-2xl border bg-white p-6 text-gray-600">불러오는 중…</div>}
      {error && <div className="rounded-2xl border bg-white p-6 text-rose-600">데이터를 불러오지 못했습니다.</div>}

      {/* 히어로 카드 */}
      <section className="rounded-3xl border bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-600 via-emerald-600 to-emerald-700 p-5 sm:p-6 text-white shadow-sm">
        <div className="mt-1 grid gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {ev?.title || "대회 정보 준비중"}
          </h2>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">주관부서</div>
              <div className="mt-1 font-semibold">{ev?.organizer || "-"}</div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">일정</div>
              <div className="mt-1 font-semibold">{ev?.schedule || "일정 미정"}</div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">게임방식</div>
              <div className="mt-1 font-semibold">
                {ev ? `${ev.modeKo} · ${ev.tierLabel}(${ev.tier})` : "게임방식 미정"}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">상품/비고</div>
              <div className="mt-1 font-semibold">{ev?.overview?.trim() ? ev.overview : "공개 예정"}</div>
            </div>
          </div>

          {/* 액션 버튼: 카드 섹션에만 표기 */}
          <div className="mt-1 flex gap-2">
            <Link href="/champ/leaderboard/event" className="inline-flex items-center justify-center rounded-xl bg-white text-emerald-800 px-4 py-2 font-bold shadow-sm hover:bg-emerald-50">
              대회순위
            </Link>
            <Link href="/champ/leaderboard/season" className="inline-flex items-center justify-center rounded-xl border border-white/40 px-4 py-2 font-bold text-white hover:bg-white/10">
              연간순위
            </Link>
          </div>
        </div>
      </section>

      {/* 공지사항만 유지 */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">공지사항</h3>
          <Link href="/champ/notice" className="text-sm text-emerald-700 hover:underline">더보기 →</Link>
        </div>
        {A(data?.notices).length ? (
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
            {A(data.notices).slice(0, 5).map((n) => (
              <li key={n.id}>
                <span className="font-medium">{n.title}</span>{" "}
                {n.createdAt && <span className="text-xs text-gray-400">· {new Date(n.createdAt).toLocaleDateString("ko-KR")}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">공지사항이 없습니다.</p>
        )}
      </section>
    </main>
  );
}
