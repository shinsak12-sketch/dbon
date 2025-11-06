// pages/champ/season-ranking.js
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());

function typeKo(t) {
  if (!t) return "-";
  if (t === "FAMILY") return "가족";
  if (t === "EMPLOYEE" || t === "STAFF") return "직원";
  return t;
}

export default function SeasonRankingPage() {
  const [year, setYear] = useState(null);
  const [sortKey, setSortKey] = useState("points"); // points | avgStrokes | played
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | EMPLOYEE | FAMILY
  const [genderFilter, setGenderFilter] = useState("ALL"); // ALL | M | F
  const [minRounds, setMinRounds] = useState(0); // 0 | 2 | 3

  const apiUrl = year
    ? `/api/champ/season-ranking?year=${year}`
    : `/api/champ/season-ranking`;

  const { data, error, isLoading } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,
  });

  // 첫 로드 시 기본 연도 세팅
  useEffect(() => {
    if (data && !year && data.year) {
      setYear(data.year);
    }
  }, [data, year]);

  const years = data?.years || [];
  const summary =
    data?.summary || {
      totalPlayers: 0,
      totalRounds: 0,
      avgRounds: 0,
      avgPoints: 0,
    };

  const processedItems = useMemo(() => {
    let items = data?.items || [];

    // 필터
    if (typeFilter !== "ALL") {
      items = items.filter((it) => it.type === typeFilter);
    }
    if (genderFilter !== "ALL") {
      items = items.filter(
        (it) => (it.gender || "").toUpperCase() === genderFilter
      );
    }
    if (minRounds > 0) {
      items = items.filter((it) => (it.playedCount || 0) >= minRounds);
    }

    // 정렬
    items = [...items];
    items.sort((a, b) => {
      if (sortKey === "avgStrokes") {
        const av = a.avgStrokes ?? 9999;
        const bv = b.avgStrokes ?? 9999;
        if (av !== bv) return av - bv;
        return (b.totalPoints || 0) - (a.totalPoints || 0);
      }
      if (sortKey === "played") {
        if ((b.playedCount || 0) !== (a.playedCount || 0)) {
          return (b.playedCount || 0) - (a.playedCount || 0);
        }
        return (b.totalPoints || 0) - (a.totalPoints || 0);
      }
      // 기본: 포인트
      if ((b.totalPoints || 0) !== (a.totalPoints || 0)) {
        return (b.totalPoints || 0) - (a.totalPoints || 0);
      }
      const av = a.avgStrokes ?? 9999;
      const bv = b.avgStrokes ?? 9999;
      return av - bv;
    });

    // 화면용 순위 번호
    return items.map((it, idx) => ({ ...it, displayRank: idx + 1 }));
  }, [data, sortKey, typeFilter, genderFilter, minRounds]);

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
      {/* 상단 타이틀 */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            연간 순위
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            시즌 전체 성적과 포인트 랭킹을 확인하세요.
          </p>
        </div>
        <Link
          href="/champ"
          className="hidden sm:inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
        >
          챔피언십 홈
        </Link>
      </div>

      {/* 필터 바 */}
      <section className="rounded-2xl border bg-white p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* 연도 선택 */}
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={year || ""}
            onChange={(e) => setYear(Number(e.target.value) || null)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* 구분 필터 */}
          <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1 rounded-full ${
                typeFilter === "ALL"
                  ? "bg-white shadow text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setTypeFilter("EMPLOYEE")}
              className={`px-3 py-1 rounded-full ${
                typeFilter === "EMPLOYEE"
                  ? "bg-white shadow text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              직원
            </button>
            <button
              onClick={() => setTypeFilter("FAMILY")}
              className={`px-3 py-1 rounded-full ${
                typeFilter === "FAMILY"
                  ? "bg-white shadow text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              가족
            </button>
          </div>

          {/* 성별 필터 */}
          <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
            <button
              onClick={() => setGenderFilter("ALL")}
              className={`px-3 py-1 rounded-full ${
                genderFilter === "ALL"
                  ? "bg-white shadow text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setGenderFilter("M")}
              className={`px-3 py-1 rounded-full ${
                genderFilter === "M"
                  ? "bg-white shadow text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              남
            </button>
            <button
              onClick={() => setGenderFilter("F")}
              className={`px-3 py-1 rounded-full ${
                genderFilter === "F"
                  ? "bg-white shadow text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              여
            </button>
          </div>

          {/* 최소 라운드 수 */}
          <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
            <button
              onClick={() => setMinRounds(0)}
              className={`px-3 py-1 rounded-full ${
                minRounds === 0
                  ? "bg-white shadow text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setMinRounds(2)}
              className={`px-3 py-1 rounded-full ${
                minRounds === 2
                  ? "bg-white shadow text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              2라운드↑
            </button>
            <button
              onClick={() => setMinRounds(3)}
              className={`px-3 py-1 rounded-full ${
                minRounds === 3
                  ? "bg-white shadow text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              3라운드↑
            </button>
          </div>
        </div>

        {/* 정렬 기준 */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs text-gray-500">정렬 기준</span>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="points">포인트</option>
            <option value="avgStrokes">평균타(실제)</option>
            <option value="played">출전수</option>
          </select>
        </div>
      </section>

      {/* 요약 카드 */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500 mb-1">전체 참가자</div>
          <div className="text-2xl font-bold text-emerald-800">
            {summary.totalPlayers || 0}
            <span className="text-sm text-gray-500 ml-1">명</span>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500 mb-1">총 라운드 / 평균</div>
          <div className="text-2xl font-bold text-emerald-800">
            {summary.totalRounds || 0}
            <span className="text-sm text-gray-500 ml-1">
              라운드 · {summary.avgRounds || 0}회/인
            </span>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs text-gray-500 mb-1">평균 포인트</div>
          <div className="text-2xl font-bold text-emerald-800">
            {summary.avgPoints || 0}
            <span className="text-sm text-gray-500 ml-1">P</span>
          </div>
        </div>
      </section>

      {/* 로딩/에러 */}
      {isLoading && (
        <div className="rounded-2xl border bg-white p-6 text-gray-600">
          불러오는 중…
        </div>
      )}
      {error && !isLoading && (
        <div className="rounded-2xl border bg-white p-6 text-rose-600">
          데이터를 불러오지 못했습니다.
        </div>
      )}

      {/* 랭킹 테이블 */}
      {!isLoading && !error && (
        <section className="rounded-2xl border bg-white">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-emerald-900">
              {year ? `${year} 시즌 연간 순위` : "연간 순위"}
            </h2>
            <div className="text-xs text-gray-500">
              참여 인원 {summary.totalPlayers || 0}명
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-emerald-50 text-emerald-900">
                  <th className="px-3 py-2 text-left">순위</th>
                  <th className="px-3 py-2 text-left">실명</th>
                  <th className="px-3 py-2 text-left">닉네임</th>
                  <th className="px-3 py-2 text-left">성별</th>
                  <th className="px-3 py-2 text-left">구분</th>
                  <th className="px-3 py-2 text-left">등급</th>
                  <th className="px-3 py-2 text-right">출전수</th>
                  <th className="px-3 py-2 text-right">우승/입상</th>
                  <th className="px-3 py-2 text-right">연간P</th>
                  <th className="px-3 py-2 text-right">평균타(보정)</th>
                  <th className="px-3 py-2 text-right">평균타(실제)</th>
                </tr>
              </thead>
              <tbody>
                {processedItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-3 py-6 text-center text-sm text-gray-500"
                    >
                      집계된 데이터가 없습니다.
                    </td>
                  </tr>
                )}
                {processedItems.map((it, idx) => (
                  <tr
                    key={it.participantId || `${it.externalNickname}-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {it.displayRank === 1
                        ? "🥇"
                        : it.displayRank === 2
                        ? "🥈"
                        : it.displayRank === 3
                        ? "🥉"
                        : it.displayRank}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {it.realName || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {it.nickname || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {it.gender || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {typeKo(it.type)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {it.grade || "—"}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {it.playedCount || 0}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {it.wins || it.top3
                        ? `${it.wins || 0}승 / ${it.top3 || 0}회`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {it.totalPoints || 0}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {it.avgNet ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {it.avgStrokes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
