// pages/champ/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());
const A = (x) => (Array.isArray(x) ? x : []);

function fmtRange(startISO, endISO) {
  if (!startISO && !endISO) return null;
  try {
    const s = startISO ? new Date(startISO) : null;
    const e = endISO ? new Date(endISO) : null;
    const f = (d) =>
      d.toLocaleString("ko-KR", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    if (s && e) return `${f(s)} ~ ${f(e)}`;
    if (s) return f(s);
    return f(e);
  } catch {
    return null;
  }
}

// overview.format에서 "티어 100" 숫자만 뽑기
const parseTier = (fmt) => {
  if (!fmt) return undefined;
  const m = String(fmt).match(/티어\s*(\d+)/);
  return m ? Number(m[1]) : undefined;
};

export default function ChampHome() {
  const { data, error, isLoading } = useSWR("/api/champ/home", fetcher, {
    revalidateOnFocus: false,
  });

  // --- 응답 포맷 호환 레이어 -----------------------------------------
  // 1) 신형 API(overview/event/leaderboards)
  // 2) 구형 API(currentEvent/eventLeaderboard/seasonLeaderboard)
  const api = data || {};

  let ev = null;
  let scheduleStr = null;

  if (api.currentEvent) {
    // 구형
    ev = {
      name: api.currentEvent.name,
      beginAt: api.currentEvent.beginAt,
      endAt: api.currentEvent.endAt,
      playedAt: api.currentEvent.playedAt,
      tier: api.currentEvent.tier,
      status: api.currentEvent.status,
      rules: api.currentEvent.rules,
      prizes: api.currentEvent.prizes,
    };
    scheduleStr = fmtRange(ev?.playedAt ?? ev?.beginAt, ev?.endAt);
  } else if (api.overview || api.event) {
    // 신형
    ev = {
      name: api.event?.title || api.overview?.title || "",
      // 신형은 보통 문자열 schedule을 바로 줌
      tier: parseTier(api.overview?.format),
      status: api.overview?.status, // 있을 수도, 없을 수도
      rules: api.overview?.format || "", // "스트로크 · 티어 100"
      prizes: api.overview?.prizes || "",
    };
    scheduleStr = api.overview?.schedule || null;
  }

  const eventLB = A(api.eventLeaderboard || api.leaderboardEvent);
  const seasonLB = A(api.seasonLeaderboard || api.leaderboardSeason);
  // -------------------------------------------------------------------

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-8">
      {/* 상태 표시 */}
      {isLoading && (
        <div className="rounded-2xl border bg-white p-6 text-gray-600">
          불러오는 중…
        </div>
      )}
      {error && (
        <div className="rounded-2xl border bg-white p-6 text-rose-600">
          데이터를 불러오지 못했습니다.
        </div>
      )}

      {/* === ① 히어로 카드 === */}
      <section className="rounded-3xl border bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-600 via-emerald-600 to-emerald-700 p-5 sm:p-6 text-white shadow-sm">
        {/* 상단 상태 칩 */}
        <div className="flex flex-wrap gap-2">
          {!ev?.name && (
            <>
              <span className="px-3 py-1 rounded-full bg-white/15 text-sm">상태 미정</span>
              <span className="px-3 py-1 rounded-full bg-white/15 text-sm">게임방식 미정</span>
              <span className="px-3 py-1 rounded-full bg-white/15 text-sm">티어 미정</span>
            </>
          )}
          {ev?.status && (
            <span className="px-3 py-1 rounded-full bg-white/15 text-sm">{ev.status}</span>
          )}
          {ev?.tier && (
            <span className="px-3 py-1 rounded-full bg-white/15 text-sm">티어 {ev.tier}</span>
          )}
        </div>

        {/* 본문 */}
        <div className="mt-3 sm:mt-4 grid gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {ev?.name || "대회 정보 준비중"}
          </h2>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">일정</div>
              <div className="mt-1 font-semibold">
                {scheduleStr || "일정 미정"}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">게임방식</div>
              <div className="mt-1 font-semibold">
                {(ev?.rules && String(ev.rules).trim()) ? ev.rules : "게임방식 미정"}
                {ev?.tier ? <span className="ml-2 text-white/80">· 티어 {ev.tier}</span> : null}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">상품/비고</div>
              <div className="mt-1 font-semibold">
                {(ev?.prizes && String(ev.prizes).trim()) ? ev.prizes : "공개 예정"}
              </div>
            </div>
          </div>

          {/* 액션 */}
          <div className="mt-1 flex gap-2">
            <Link
              href="/champ/events/current"
              className="inline-flex items-center justify-center rounded-xl bg-white text-emerald-800 px-4 py-2 font-bold shadow-sm hover:bg-emerald-50"
            >
              더보기 →
            </Link>
            <Link
              href="/champ/leaderboard/event"
              className="inline-flex items-center justify-center rounded-xl border border-white/40 px-4 py-2 font-bold text-white hover:bg-white/10"
            >
              리더보드
            </Link>
          </div>
        </div>
      </section>

      {/* === ② 대회 리더보드 === */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">대회 리더보드</h3>
          <Link href="/champ/leaderboard/event" className="text-sm text-emerald-700 hover:underline">
            더보기 →
          </Link>
        </div>

        {eventLB.length ? (
          <ul className="divide-y">
            {eventLB.map((row) => (
              <li key={`${row.rank}-${row.nickname}`} className="flex items-center justify-between py-2">
                <span className="font-semibold">{row.rank}위</span>
                <span className="flex-1 text-center">
                  {row.name} <span className="text-gray-500">({row.nickname})</span>
                </span>
                <span className="font-bold text-emerald-700">
                  {row.strokes ?? "-"}
                  {row.strokes != null && <span className="text-sm text-gray-500"> 타</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">진행 중인 대회 리더보드가 없습니다.</p>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
          <div>🏆 다승왕: 준비중</div>
          <div>🌟 신인상: 준비중</div>
          <div>📈 성장상: 준비중</div>
        </div>
      </section>

      {/* === ③ 연간 포인트 리더보드 === */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">연간 포인트 리더보드</h3>
          <Link href="/champ/leaderboard/season" className="text-sm text-emerald-700 hover:underline">
            더보기 →
          </Link>
        </div>

        {seasonLB.length ? (
          <ul className="divide-y">
            {seasonLB.map((row) => (
              <li key={`${row.rank}-${row.nickname}`} className="flex items-center justify-between py-2">
                <span className="font-semibold">{row.rank}위</span>
                <span className="flex-1 text-center">
                  {row.name} <span className="text-gray-500">({row.nickname})</span>
                </span>
                <span className="font-bold text-blue-600">{row.totalPoints} pts</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">포인트 데이터가 없습니다.</p>
        )}
      </section>

      {/* === ④ 공지사항 === */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">공지사항</h3>
          <Link href="/champ/notice" className="text-sm text-emerald-700 hover:underline">
            더보기 →
          </Link>
        </div>

        {A(api?.notices).length ? (
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
            {A(api.notices).slice(0, 5).map((n) => (
              <li key={n.id}>
                <span className="font-medium">{n.title}</span>{" "}
                {n.createdAt && (
                  <span className="text-xs text-gray-400">
                    · {new Date(n.createdAt).toLocaleDateString("ko-KR")}
                  </span>
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
