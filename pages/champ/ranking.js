// pages/champ/ranking.js
import { useEffect, useState } from "react";

export default function ChampRanking() {
  const [years, setYears] = useState([]); // 연도 리스트
  const [events, setEvents] = useState([]); // 대회 리스트
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [stats, setStats] = useState({});
  const [sortKey, setSortKey] = useState("net"); // 보정 기준
  const [loading, setLoading] = useState(false);

  // ① 연도 목록 불러오기
  useEffect(() => {
    fetch("/api/admin/champ/events")
      .then((r) => r.json())
      .then((d) => {
        const ys = [
          ...new Set(
            (d.items || []).map((e) => new Date(e.playedAt || e.beginAt).getFullYear())
          ),
        ].sort((a, b) => b - a);
        setYears(ys);
        setSelectedYear(ys[0]);
      });
  }, []);

  // ② 연도 선택 시 해당 연도 대회 불러오기
  useEffect(() => {
    if (!selectedYear) return;
    fetch("/api/admin/champ/events")
      .then((r) => r.json())
      .then((d) => {
        const evs = (d.items || []).filter(
          (e) => new Date(e.playedAt || e.beginAt).getFullYear() === selectedYear
        );
        setEvents(evs);
        if (evs.length > 0) setSelectedEvent(evs[0]);
      });
  }, [selectedYear]);

  // ③ 순위 데이터 불러오기
  async function loadRanking() {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/champ/ranking?eventId=${selectedEvent.id}`);
      const d = await r.json();
      setRanking(d.items || []);
      setStats(d.stats || {});
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadRanking();
  }, [selectedEvent]);

  // ④ 정렬 기준 전환
  function toggleSort() {
    setSortKey((k) => (k === "net" ? "strokes" : "net"));
  }

  return (
    <main className="min-h-screen bg-emerald-50">
      <div className="max-w-5xl mx-auto p-4">
        {/* 헤더 */}
        <header className="flex flex-wrap gap-3 items-center justify-between mb-6">
          <div className="flex gap-2">
            {/* 연도 선택 */}
            <select
              value={selectedYear || ""}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 bg-white"
            >
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            {/* 대회 선택 */}
            <select
              value={selectedEvent?.id || ""}
              onChange={(e) =>
                setSelectedEvent(events.find((ev) => ev.id === Number(e.target.value)))
              }
              className="border rounded-lg px-3 py-2 bg-white min-w-[200px]"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={toggleSort}
              className="rounded-lg bg-white border px-3 py-2 text-sm"
            >
              정렬기준: {sortKey === "net" ? "보정" : "실제"}
            </button>
            <button
              onClick={loadRanking}
              className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm font-semibold"
            >
              새로고침
            </button>
          </div>
        </header>

        {/* 대회명 */}
        <h1 className="text-2xl font-extrabold text-emerald-800 mb-4">
          {selectedEvent?.name || "대회 선택"}
        </h1>

        {/* 테이블 */}
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-emerald-100 text-emerald-800 font-semibold">
              <tr>
                <th className="px-3 py-2">순위</th>
                <th className="px-3 py-2">실명</th>
                <th className="px-3 py-2">닉네임</th>
                <th className="px-3 py-2">구분</th>
                <th className="px-3 py-2">타수(실제)</th>
                <th className="px-3 py-2">타수(보정)</th>
                <th className="px-3 py-2">연간P</th>
                <th className="px-3 py-2">연간평균타</th>
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-400">
                    {loading ? "불러오는 중…" : "데이터가 없습니다."}
                  </td>
                </tr>
              )}
              {ranking.map((r) => (
                <tr
                  key={r.rank}
                  className="border-t hover:bg-emerald-50 text-center"
                >
                  <td className="px-3 py-2 font-semibold">
                    {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}
                  </td>
                  <td className="px-3 py-2">{r.realName}</td>
                  <td className="px-3 py-2 font-semibold text-emerald-800">
                    {r.nickname}
                  </td>
                  <td className="px-3 py-2">
                    {r.type === "직원" ? (
                      <span className="bg-emerald-100 text-emerald-700 rounded px-2 py-0.5 text-xs">
                        직원
                      </span>
                    ) : r.type === "가족" ? (
                      <span className="bg-gray-100 text-gray-700 rounded px-2 py-0.5 text-xs">
                        가족
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">{r.strokes ?? "—"}</td>
                  <td className="px-3 py-2">{r.net ?? "—"}</td>
                  <td className="px-3 py-2">{r.points ?? "—"}</td>
                  <td className="px-3 py-2">{r.avgStroke ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 하단 통계 */}
        <div className="mt-3 text-sm text-gray-600 flex justify-between">
          <span>
            참여인원 {stats.total || 0}명 · 등록 {stats.regCount || 0}명 · 미등록{" "}
            {stats.unregCount || 0}명
          </span>
        </div>
      </div>
    </main>
  );
}
