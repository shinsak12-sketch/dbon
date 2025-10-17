// pages/champ/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function ChampHome() {
  const { data, error, isLoading } = useSWR("/api/champ/home", fetcher, { revalidateOnFocus: false });
  const ev = data?.currentEvent || null;

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-8">
      {isLoading && <div className="rounded-2xl border bg-white p-6 text-gray-600">불러오는 중…</div>}
      {error && <div className="rounded-2xl border bg-white p-6 text-rose-600">데이터를 불러오지 못했습니다.</div>}

      {/* 히어로 카드 */}
      <section className="rounded-3xl border bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-600 via-emerald-600 to-emerald-700 p-5 sm:p-6 text-white shadow-sm">
        <div className="mt-1 grid gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {ev?.name || "대회 정보 준비중"}
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
                {ev ? `${ev.modeKo} · ${ev.tierKo}` : "게임방식 미정"}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">상품/비고</div>
              <div className="mt-1 font-semibold">{(ev?.overview || "").trim() || "공개 예정"}</div>
            </div>
          </div>

          {/* 카드 내부 버튼만 유지 */}
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

      {/* 공지사항 */}
<section className="rounded-2xl border bg-white p-6">
  <div className="mb-4 flex items-center justify-between">
    <h3 className="text-xl font-bold">공지사항</h3>
    <Link href="/champ/notice" className="text-sm text-emerald-700 hover:underline">
      더보기 →
    </Link>
  </div>

  {Array.isArray(data?.notices) && data.notices.length ? (
    <ul className="space-y-3">
      {data.notices.map((n) => (
        <li key={n.id} className="text-sm">
          <div className="font-medium mb-0.5">{n.title}</div>
          <div className="text-gray-700 whitespace-pre-wrap">{n.content}</div>
          {n.createdAt && (
            <div className="text-xs text-gray-400 mt-1">
              {new Date(n.createdAt).toLocaleDateString("ko-KR")}
            </div>
          )}
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
