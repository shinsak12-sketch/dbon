// pages/champ/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());
// 배열 가드
const A = (x) => (Array.isArray(x) ? x : []);

// 공통 카드
function SectionCard({ title, href, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900">
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            더보기 <span aria-hidden>→</span>
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

// 스켈레톤
function Skeleton({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 w-full animate-pulse rounded bg-gray-100"
        />
      ))}
    </div>
  );
}

// 라벨-값
function LV({ label, children }) {
  return (
    <p className="flex items-start gap-2 text-[15px] leading-6 text-gray-700">
      <span className="shrink-0 min-w-16 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{children}</span>
    </p>
  );
}

export default function ChampHome() {
  const { data, error, isLoading } = useSWR("/api/champ/home", fetcher, {
    revalidateOnFocus: false,
  });

  return (
    <main className="mx-auto max-w-3xl p-5 sm:p-6 space-y-6 sm:space-y-8">
      {/* 헤더는 글로벌에서 렌더된다고 가정 */}

      {/* 로딩/에러 상단 상태바 */}
      {isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          불러오는 중이에요…
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      )}

      {/* ① 이번 대회 개요 */}
      <SectionCard title="이번 대회 개요" href="/champ/events/current">
        {!data ? (
          <Skeleton lines={5} />
        ) : data.overview ? (
          <div className="space-y-2">
            {data.overview.title && <LV label="대회명">{data.overview.title}</LV>}
            {data.overview.schedule && (
              <LV label="일정">{data.overview.schedule}</LV>
            )}
            {data.overview.course && (
              <LV label="장소">{data.overview.course}</LV>
            )}
            {data.overview.format && (
              <LV label="게임방식">{data.overview.format}</LV>
            )}
            {data.overview.prizes && (
              <LV label="상품">{data.overview.prizes}</LV>
            )}
          </div>
        ) : (
          <Empty message="현재 공개된 개요가 없습니다." />
        )}
      </SectionCard>

      {/* ② 대회 리더보드 */}
      <SectionCard title="대회 리더보드" href="/champ/leaderboard/event">
        {!data ? (
          <Skeleton lines={6} />
        ) : data.event && A(data.leaderboardEvent).length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {A(data.leaderboardEvent).map((row) => (
              <li
                key={`${row.rank}-${row.nickname}`}
                className="flex items-center justify-between py-2.5"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                  {row.rank}
                </span>
                <span className="mx-3 flex-1 truncate text-[15px] text-gray-900">
                  {row.name}{" "}
                  <span className="text-gray-500">({row.nickname})</span>
                </span>
                <span className="text-[15px] font-extrabold text-emerald-700">
                  {row.strokes}
                  <span className="ml-1 text-sm font-medium text-gray-500">
                    타
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty message="진행 중인 대회 리더보드가 없습니다." />
        )}

        {/* 미니 배지 */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-gray-600">
          <Badge>🏆 다승왕: 준비중</Badge>
          <Badge>🌟 신인상: 준비중</Badge>
          <Badge>📈 성장상: 준비중</Badge>
        </div>
      </SectionCard>

      {/* ③ 연간 포인트 리더보드 */}
      <SectionCard title="연간 포인트 리더보드" href="/champ/leaderboard/season">
        {!data ? (
          <Skeleton lines={6} />
        ) : A(data.leaderboardSeason).length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {A(data.leaderboardSeason).map((row) => (
              <li
                key={`${row.rank}-${row.nickname}`}
                className="flex items-center justify-between py-2.5"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700">
                  {row.rank}
                </span>
                <span className="mx-3 flex-1 truncate text-[15px] text-gray-900">
                  {row.name}{" "}
                  <span className="text-gray-500">({row.nickname})</span>
                </span>
                <span className="text-[15px] font-extrabold text-sky-700">
                  {row.totalPoints}
                  <span className="ml-1 text-sm font-medium text-gray-500">
                    pts
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty message="포인트 데이터가 없습니다." />
        )}
      </SectionCard>

      {/* ④ 공지사항 */}
      <SectionCard title="공지사항" href="/champ/notice">
        {!data ? (
          <Skeleton lines={5} />
        ) : A(data.notices).length ? (
          <ul className="space-y-2 text-[15px] text-gray-900">
            {A(data.notices)
              .slice(0, 5)
              .map((n) => (
                <li key={n.id} className="flex items-center justify-between">
                  <span className="line-clamp-1 pr-3 font-medium">{n.title}</span>
                  {n.createdAt && (
                    <time
                      dateTime={n.createdAt}
                      className="shrink-0 text-xs text-gray-500"
                    >
                      {new Date(n.createdAt).toLocaleDateString("ko-KR")}
                    </time>
                  )}
                </li>
              ))}
          </ul>
        ) : (
          <Empty message="공지사항이 없습니다." />
        )}
      </SectionCard>
    </main>
  );
}

// 서브 컴포넌트들
function Empty({ message }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

function Badge({ children }) {
  return (
    <div className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1">
      {children}
    </div>
  );
                  }
