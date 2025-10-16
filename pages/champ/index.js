// pages/champ/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());

/** 날짜 YYYY.MM.DD */
function fmtDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  } catch {
    return null;
  }
}

/** 날짜 구간 */
function fmtRange(beginISO, endISO, fallbackText) {
  const s = fmtDate(beginISO);
  const e = fmtDate(endISO);
  if (s && e) return `${s} ~ ${e}`;
  if (s) return s;
  if (e) return e;
  return fallbackText || "일정 미정";
}

/** roundNo 표기: “제n회”로 보정(이미 “제”로 시작하면 그대로) */
function fmtRound(roundNo) {
  if (!roundNo) return "";
  const t = String(roundNo).trim();
  if (t.startsWith("제")) return t;
  // 숫자만 들어왔을 때
  const n = t.replace(/[^0-9]/g, "");
  return n ? `제${n}회` : t;
}

/** tier → 라벨 */
function tierLabel(tier) {
  const n = Number(tier);
  if (n >= 120) return "메이저(120)";
  if (n <= 80) return "라이트(80)";
  return "스탠다드(100)";
}

/** API 응답을 최대한 포괄적으로 평탄화 */
function normalizeEventPayload(api) {
  const cur = api?.currentEvent || api?.event || null;
  const ov = api?.overview || {}; // KV 경로일 때 제목/일정 문자열만 오는 경우가 있음

  // 가능한 모든 키에서 값 추출
  const name = cur?.name || ov?.title || "";
  const roundNo = cur?.roundNo || ov?.roundNo || null;
  const organizer =
    cur?.organizer || cur?.org || ov?.organizer || ov?.org || ov?.course || ""; // course를 주관부서로 썼던 경우 대비
  const mode = cur?.mode || ov?.mode || null;
  const tier = cur?.tier ?? ov?.tier ?? null;
  const beginAt = cur?.beginAt || cur?.playedAt || ov?.beginAt || null;
  const endAt = cur?.endAt || ov?.endAt || null;
  const scheduleText = ov?.schedule || null; // 이미 포맷된 텍스트가 온 경우
  const prizes =
    cur?.prizes || ov?.prizes || ov?.overview || ov?.remarks || ""; // 비고/개요 텍스트

  return {
    title: name,
    roundNo,
    organizer,
    mode,
    tier,
    beginAt,
    endAt,
    scheduleText,
    prizes,
  };
}

export default function ChampHome() {
  const { data, error, isLoading } = useSWR("/api/champ/home", fetcher, {
    revalidateOnFocus: false,
  });

  const ev = normalizeEventPayload(data || {});
  const title =
    (ev.roundNo ? `${fmtRound(ev.roundNo)} ` : "") +
    (ev.title || "대회 정보 준비중");
  const schedule = fmtRange(ev.beginAt, ev.endAt, ev.scheduleText);
  const modeLine =
    (ev.mode ? ev.mode : "게임방식 미정") +
    (ev.tier != null ? ` · ${tierLabel(ev.tier)}` : "");

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-8">
      {/* 상태 */}
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

      {/* === 개요 카드 === */}
      <section className="rounded-3xl border bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-600 via-emerald-600 to-emerald-700 p-5 sm:p-6 text-white shadow-sm">
        <div className="grid gap-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {title}
          </h2>

          <div className="grid gap-3">
            {/* 주관부서 */}
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">주관부서</div>
              <div className="mt-1 font-semibold">
                {ev.organizer || "미정"}
              </div>
            </div>

            {/* 일정 */}
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">일정</div>
              <div className="mt-1 font-semibold">{schedule}</div>
            </div>

            {/* 게임방식 */}
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">게임방식</div>
              <div className="mt-1 font-semibold">{modeLine}</div>
            </div>

            {/* 상품/비고 */}
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
              <div className="text-white/80 text-sm">상품/비고</div>
              <div className="mt-1 font-semibold">
                {ev.prizes ? ev.prizes : "공개 예정"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === 액션 버튼 (개요 아래, 공지 위) === */}
      <section className="flex gap-3">
        <Link
          href="/champ/leaderboard/event"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white px-4 py-2 font-bold shadow-sm hover:bg-emerald-700"
        >
          대회순위
        </Link>
        <Link
          href="/champ/leaderboard/season"
          className="inline-flex items-center justify-center rounded-xl border border-emerald-600 text-emerald-700 px-4 py-2 font-bold hover:bg-emerald-50"
        >
          연간순위
        </Link>
      </section>

      {/* === 공지사항만 유지 === */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">공지사항</h3>
          <Link href="/champ/notice" className="text-sm text-emerald-700 hover:underline">
            더보기 →
          </Link>
        </div>

        {Array.isArray(data?.notices) && data.notices.length ? (
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-700">
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
    </main>
  );
}
