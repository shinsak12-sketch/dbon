// pages/champ/ranking.js
import { useEffect, useMemo, useState } from "react";

const fetchJSON = (u) => fetch(u).then((r) => r.json());

export default function ChampRanking() {
  const [years, setYears] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, regCount: 0, unregCount: 0 });
  const [sortKey, setSortKey] = useState("net"); // "net" | "strokes"
  const [loading, setLoading] = useState(false);

  // ① 연도 목록
  useEffect(() => {
    fetchJSON("/api/admin/champ/events").then((d) => {
      const items = Array.isArray(d?.items) ? d.items : [];
      const ys = [
        ...new Set(items.map((e) => new Date(e.playedAt || e.beginAt).getFullYear())),
      ].sort((a, b) => b - a);
      setYears(ys);
      if (ys.length) setSelectedYear(ys[0]);
    });
  }, []);

  // ② 연도 기준 대회 목록
  useEffect(() => {
    if (!selectedYear) return;
    fetchJSON("/api/admin/champ/events").then((d) => {
      const items = Array.isArray(d?.items) ? d.items : [];
      const evs = items
        .filter((e) => new Date(e.playedAt || e.beginAt).getFullYear() === selectedYear)
        .map((e) => ({ id: e.id, name: e.name, playedAt: e.playedAt || e.beginAt }));
      setEvents(evs);
      if (evs.length) setSelectedEvent(evs[0]);
    });
  }, [selectedYear]);

  // ③ 랭킹 로드
  async function loadRanking() {
    if (!selectedEvent?.id) return;
    setLoading(true);
    try {
      const d = await fetchJSON(`/api/champ/ranking?eventId=${selectedEvent.id}`);
      setRows(Array.isArray(d?.items) ? d.items : []);
      setStats(d?.stats || { total: 0, regCount: 0, unregCount: 0 });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadRanking(); }, [selectedEvent]);

  // ④ 정렬 기준 전환
  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sortKey === "net") {
      copy.sort((a, b) => {
        const an = a.net ?? Infinity, bn = b.net ?? Infinity;
        if (an !== bn) return an - bn;
        const ag = a.strokes ?? Infinity, bg = b.strokes ?? Infinity;
        if (ag !== bg) return ag - bg;
        return String(a.nickname || "").localeCompare(String(b.nickname || ""));
      });
    } else {
      copy.sort((a, b) => {
        const ag = a.strokes ?? Infinity, bg = b.strokes ?? Infinity;
        if (ag !== bg) return ag - bg;
        const an = a.net ?? Infinity, bn = b.net ?? Infinity;
        if (an !== bn) return an - bn;
        return String(a.nickname || "").localeCompare(String(b.nickname || ""));
      });
    }
    // 순위 다시 매겨서 사용(보여주기용)
    return copy.map((r, i) => ({ ...r, rank: i + 1 }));
  }, [rows, sortKey]);

  return (
    <main className="min-h-screen bg-emerald-50">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        {/* 상단 필터 바 */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={selectedYear || ""}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border bg-white px-3 py-2"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={selectedEvent?.id || ""}
            onChange={(e) =>
              setSelectedEvent(
                events.find((ev) => ev.id === Number(e.target.value)) || null
              )
            }
            className="min-w-[220px] rounded-lg border bg-white px-3 py-2"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSortKey((k) => (k === "net" ? "strokes" : "net"))}
              className="rounded-lg border bg-white px-3 py-2 text-sm"
            >
              정렬기준: {sortKey === "net" ? "보정" : "실제"}
            </button>
            <button
              onClick={loadRanking}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
            >
              새로고침
            </button>
          </div>
        </div>

        {/* 대회명 */}
        <h1 className="mb-3 text-2xl font-extrabold text-emerald-900">
          {selectedEvent?.name || "대회 선택"}
        </h1>

        {/* 테이블 (모바일 가로 스크롤) */}
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-emerald-100 text-emerald-900">
              <tr className="text-center">
                <th className="px-3 py-2">순위</th>
                <th className="px-3 py-2">실명</th>
                <th className="px-3 py-2">닉네임</th>
                <th className="px-3 py-2">성별</th>
                <th className="px-3 py-2">구분</th>
                <th className="px-3 py-2">등급</th>
                <th className="px-3 py-2">타수(실제)</th>
                <th className="px-3 py-2">타수(보정)</th>
                <th className="px-3 py-2">연간P</th>
                <th className="px-3 py-2">연간평균타</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-500">
                    불러오는 중…
                  </td>
                </tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-gray-400">
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
              {!loading &&
                sorted.map((r) => (
                  <tr key={`${r.nickname}-${r.rank}`} className="text-center border-t">
                    <td className="px-3 py-2 font-semibold">
                      {r.rank <= 3 ? ["🥇","🥈","🥉"][r.rank - 1] : r.rank}
                    </td>

                    {/* 실명/닉네임: 같은 색/같은 두께 */}
                    <td className="px-3 py-2 text-gray-900 font-medium">
                      {r.realName}
                    </td>
                    <td className="px-3 py-2 text-gray-900 font-medium">
                      {r.nickname}
                    </td>

                    <td className="px-3 py-2 text-gray-700">{r.gender || "—"}</td>

                    <td className="px-3 py-2">
                      {r.type === "직원" ? (
                        <span className="rounded px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800">직원</span>
                      ) : r.type === "가족" ? (
                        <span className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-700">가족</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-gray-700">{r.grade || "—"}</td>

                    <td className="px-3 py-2 text-right tabular-nums">{r.strokes ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.net ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.points ?? 0}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.avgStroke ?? "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* 하단 통계 */}
        <div className="mt-3 flex justify-between text-sm text-gray-600">
          <span>
            참여인원 {stats.total || 0}명 · 등록 {stats.regCount || 0}명 · 미등록 {stats.unregCount || 0}명
          </span>
        </div>
      </div>
    </main>
  );
}
