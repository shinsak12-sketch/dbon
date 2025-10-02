// pages/champ/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());
const A = (x) => (Array.isArray(x) ? x : []);

function fmtDT(dt) {
  if (!dt) return null;
  try {
    return new Date(dt).toLocaleString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export default function ChampHome() {
  const { data, error, isLoading } = useSWR("/api/champ/home", fetcher, {
    revalidateOnFocus: false,
  });

  // 안전 분해
  const ev = data?.currentEvent || null;
  const start = fmtDT(ev?.beginAt || ev?.playedAt);
  const end = fmtDT(ev?.endAt);
  const mode = ev?.mode || "게임방식 미정";
  const tier = ev?.tier ? `티어 ${ev.tier}` : "티어 미정";
  const state = ev?.status || "상태 미정";
  const title = ev?.name || "대회 정보 준비중";

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 space-y-8">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          DB ON Championship <span className="ml-1">🏌️‍♂️</span>
        </h1>
        <div className="flex gap-2">
          <Link
            href="/champ"
            className="rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm font-semibold hover:bg-emerald-100"
          >
            내정보
          </Link>
          <Link
            href="/champ/me"
            className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-700"
          >
            선수등록
          </Link>
        </div>
      </header>

      {/* ===== 스타일 A 히어로 + 글래스 카드 ===== */}
      <section className="relative overflow-hidden rounded-2xl">
        {/* 배경 그라데이션 + 패턴 */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,.25) 0 2px, transparent 2px), radial-gradient(circle at 80% 30%, rgba(255,255,255,.18) 0 2px, transparent 2px), radial-gradient(circle at 40% 70%, rgba(255,255,255,.18) 0 2px, transparent 2px)",
            backgroundSize: "24px 24px, 28px 28px, 32px 32px",
          }}
        />

        {/* 내용 */}
        <div className="relative p-5 sm:p-7">
          {/* 상단 라벨/칩 */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center rounded-full bg-white/15 text-white/90 border border-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              {state}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/15 text-white/90 border border-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              {mode}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/15 text-white/90 border border-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              {tier}
            </span>
          </div>

          {/* 타이틀 */}
          <h2 className="text-white text-2xl sm:text-3xl font-extrabold drop-shadow-sm">
            {title}
          </h2>

          {/* 유리 카드들 */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4 text-white">
              <div className="text-xs opacity-80 mb-1">일정</div>
              {start || end ? (
                <div className="text-sm leading-5">
                  {start && <div>시작 · {start}</div>}
                  {end && <div>종료 · {end}</div>}
                </div>
              ) : (
                <div className="text-sm">일정 미정</div>
              )}
            </div>

            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4 text-white">
              <div className="text-xs opacity-80 mb-1">게임방식</div>
              <div className="text-sm">{mode}</div>
            </div>

            <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur p-4 text-white">
              <div className="text-xs opacity-80 mb-1">상품/비고</div>
              <div className="text-sm line-clamp-2">
                {ev?.prizes || ev?.overview || "공개 예정"}
              </div>
            </div>
          </div>

          {/* 액션 */}
          <div className="mt-5 flex items-center gap-2">
            <Link
              href="/champ/events/current"
              className="inline-flex items-center rounded-xl bg-white text-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-50 shadow"
            >
              더보기 →
            </Link>
            <Link
              href="/champ/leaderboard/event"
              className="inline-flex items-center rounded-xl border border-white/30 text-white px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              리더보드
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 대회 리더보드 ===== */}
      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">대회 리더보드</h3>
          <Link
            href="/champ/leaderboard/event"
            className="text-sm text-emerald-700 hover:underline"
          >
            더보기 →
          </Link>
        </div>

        {ev && A(data?.eventLeaderboard).length > 0 ? (
          <ul className="divide-y rounded-xl border">
            {A(data.eventLeaderboard).slice(0, 10).map((row) => (
              <li
                key={`${row.rank}-${row.nickname}`}
                className="flex items-center justify-between px-4 py-2"
              >
                <span className="w-10 text-center font-semibold">{row.rank}</span>
                <span className="flex-1 truncate px-2">
                  {row.name}{" "}
                  <span className="text-gray-500">({row.nickname})</span>
                </span>
                <span className="font-bold text-emerald-700">
                  {row.strokes ?? "-"}
                  {row.strokes != null && (
                    <span className="ml-1 text-sm text-gray-500">타</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-gray-500">
            진행 중인 대회 리더보드가 없습니다.
          </p>
        )}

        {/* KPI 칩 */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-gray-600">
          <div className="rounded-xl border px-3 py-2">🏆 다승왕: 준비중</div>
          <div className="rounded-xl border px-3 py-2">🌟 신인상: 준비중</div>
          <div className="rounded-xl border px-3 py-2">📈 성장상: 준비중</div>
        </div>
      </section>

      {/* ===== 연간 포인트 리더보드 ===== */}
      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">연간 포인트 리더보드</h3>
          <Link
            href="/champ/leaderboard/season"
            className="text-sm text-emerald-700 hover:underline"
          >
            더보기 →
          </Link>
        </div>

        {A(data?.seasonLeaderboard).length > 0 ? (
          <ul className="divide-y rounded-xl border">
            {A(data.seasonLeaderboard).slice(0, 10).map((row) => (
              <li
                key={`${row.rank}-${row.nickname}`}
                className="flex items-center justify-between px-4 py-2"
              >
                <span className="w-10 text-center font-semibold">{row.rank}</span>
                <span className="flex-1 truncate px-2">
                  {row.name}{" "}
                  <span className="text-gray-500">({row.nickname})</span>
                </span>
                <span className="font-bold text-blue-600">
                  {row.totalPoints} pts
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-gray-500">
            포인트 데이터가 없습니다.
          </p>
        )}
      </section>

      {/* ===== 공지사항 ===== */}
      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">공지사항</h3>
          <Link
            href="/champ/notice"
            className="text-sm text-emerald-700 hover:underline"
          >
            더보기 →
          </Link>
        </div>

        {A(data?.notices).length ? (
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
            {A(data.notices)
              .slice(0, 5)
              .map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3">
                  <span className="truncate">{n.title}</span>
                  {n.createdAt && (
                    <span className="shrink-0 text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">공지사항이 없습니다.</p>
        )}
      </section>

      {/* 상태 메시지 */}
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
    </main>
  );
          }
