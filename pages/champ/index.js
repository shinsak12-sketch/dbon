// pages/champ/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function ChampHome() {
  const { data, error, isLoading } = useSWR("/api/champ/home", fetcher, {
    revalidateOnFocus: false,
  });

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      {/* 헤더는 _app.js에서 이미 렌더됨 */}

      {/* 상태 */}
      {isLoading && (
        <div className="rounded-2xl border bg-white p-6 text-gray-600">불러오는 중…</div>
      )}
      {error && (
        <div className="rounded-2xl border bg-white p-6 text-rose-600">
          데이터를 불러오지 못했습니다.
        </div>
      )}

      {/* 데이터가 있을 때만 렌더 */}
      {data && (
        <>
          {/* ① 이번 대회 개요 */}
          <section className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">이번 대회 개요</h2>
              <Link href="/champ/events/current" className="text-sm text-emerald-700 hover:underline">
                더보기 →
              </Link>
            </div>
            {data.overview ? (
              <div className="space-y-2 text-sm text-gray-700">
                {data.overview.title && (
                  <p>
                    <b>대회명:</b> {data.overview.title}
                  </p>
                )}
                {data.overview.schedule && (
                  <p>
                    <b>일정:</b> {data.overview.schedule}
                  </p>
                )}
                {data.overview.course && (
                  <p>
                    <b>장소:</b> {data.overview.course}
                  </p>
                )}
                {data.overview.format && (
                  <p>
                    <b>게임방식:</b> {data.overview.format}
                  </p>
                )}
                {data.overview.prizes && (
                  <p>
                    <b>상품:</b> {data.overview.prizes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">현재 공개된 개요가 없습니다.</p>
            )}
          </section>

          {/* ② 대회 리더보드 */}
          <section className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">대회 리더보드</h2>
              <Link href="/champ/leaderboard/event" className="text-sm text-emerald-700 hover:underline">
                더보기 →
              </Link>
            </div>
            {data.event && data.leaderboardEvent.length > 0 ? (
              <ul className="divide-y">
                {data.leaderboardEvent.map((row) => (
                  <li key={row.rank + row.nickname} className="flex items-center justify-between py-2">
                    <span className="font-semibold">{row.rank}위</span>
                    <span className="flex-1 text-center">
                      {row.name} <span className="text-gray-500">({row.nickname})</span>
                    </span>
                    <span className="font-bold text-emerald-700">
                      {row.strokes}
                      <span className="text-sm text-gray-500"> 타</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                진행 중인 대회 리더보드가 없습니다.
              </p>
            )}

            {/* 미니 특별상 (데모: 후속 API에서 계산/주입 예정) */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center text-gray-600">
              <div>🏆 다승왕: 준비중</div>
              <div>🌟 신인상: 준비중</div>
              <div>📈 성장상: 준비중</div>
            </div>
          </section>

          {/* ③ 연간 포인트 리더보드 */}
          <section className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">연간 포인트 리더보드</h2>
              <Link href="/champ/leaderboard/season" className="text-sm text-emerald-700 hover:underline">
                더보기 →
              </Link>
            </div>
            {data.leaderboardSeason.length > 0 ? (
              <ul className="divide-y">
                {data.leaderboardSeason.map((row) => (
                  <li key={row.rank + row.nickname} className="flex items-center justify-between py-2">
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

          {/* ④ 공지사항 */}
          <section className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">공지사항</h2>
              <Link href="/champ/notice" className="text-sm text-emerald-700 hover:underline">
                더보기 →
              </Link>
            </div>
            {data.notices?.length ? (
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                {data.notices.slice(0, 5).map((n) => (
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
        </>
      )}
    </main>
  );
  }
