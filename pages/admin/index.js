// pages/admin/index.js
import { useEffect, useState } from "react";
import Uploader from "../../components/Uploader";
import Link from "next/link";

const ADMIN_PASS = "dbsonsa"; // 간편 보호 (필요하면 .env로 분리)

export default function Admin() {
  // ── 간단 로그인 ───────────────────────────────
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  function tryLogin(e) {
    e.preventDefault();
    if (pwd === ADMIN_PASS) setAuthed(true);
    else alert("비밀번호가 틀렸습니다.");
  }

  // ── 랜딩 배경 이미지 관리 ─────────────────────
  const [bgUrl, setBgUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/background")
      .then((r) => r.json())
      .then((d) => setBgUrl(d?.url || ""))
      .catch(() => {});
  }, []);

  async function onUploaded(url) {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASS, url }),
      });
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "SERVER_ERROR");
      setBgUrl(url);
      alert("배경 이미지가 저장되었습니다.");
    } catch {
      alert("SERVER_ERROR");
    } finally {
      setSaving(false);
    }
  }

  // ── 선수 검색 & 관리 ───────────────────────────
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);

  async function search() {
    if (!q.trim()) {
      setList([]);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `/api/champ/admin/participants?q=${encodeURIComponent(q)}&admin=${ADMIN_PASS}`
      );
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "검색 실패");
      setList(Array.isArray(data.items) ? data.items : []);
    } catch {
      alert("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(id, tempPassword) {
    const pw = String(tempPassword || "").trim();
    if (pw.length < 4) return alert("임시 비밀번호를 4자 이상 입력하세요.");
    if (!confirm("해당 참가자의 비밀번호를 이 값으로 초기화할까요?")) return;

    try {
      const r = await fetch("/api/champ/admin/participants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: ADMIN_PASS, id, newPassword: pw }),
      });
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "초기화 실패");
      alert("초기화 완료. 선수에게 새 비밀번호를 안내하세요.");
      search();
    } catch {
      alert("네트워크 오류");
    }
  }

  async function deleteParticipant(id) {
    if (!confirm("정말 이 선수를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      const r = await fetch("/api/champ/admin/participants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: ADMIN_PASS, id }),
      });
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "삭제 실패");
      alert("삭제되었습니다.");
      search();
    } catch {
      alert("네트워크 오류");
    }
  }

  // ── 로그인 화면 ───────────────────────────────
  if (!authed) {
    return (
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">관리자 로그인</h1>
        <form onSubmit={tryLogin} className="space-y-3">
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="비밀번호"
            className="w-full border rounded-lg p-3"
          />
          <button className="w-full rounded-lg bg-emerald-700 text-white p-3 font-semibold">
            들어가기
          </button>
        </form>
      </main>
    );
  }

  // ── 관리자 대시보드 ───────────────────────────
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">관리 도구</h1>
        <Link href="/champ" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          챔피언십 홈
        </Link>
      </div>

      {/* ① 랜딩 배경 이미지 */}
      <section className="rounded-2xl border p-5 space-y-4 bg-white">
        <h2 className="text-xl font-bold">① 랜딩 배경 바꾸기 (덮어쓰기)</h2>
        {bgUrl ? (
          <div className="rounded-xl overflow-hidden border">
            <img src={bgUrl} alt="현재 배경" className="w-full" />
          </div>
        ) : (
          <p className="text-gray-600">현재 등록된 배경이 없습니다.</p>
        )}
        <Uploader
          label={saving ? "업로드 중…" : "이미지 업로드"}
          onUploaded={onUploaded}
          disabled={saving}
        />
      </section>

      {/* ② 챔피언십 관리 */}
      <section className="rounded-2xl border p-5 space-y-4 bg-white">
        <h2 className="text-xl font-bold">② 디비온 챔피언십 관리</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/champ/admin/events/new" className="block rounded-xl border p-3 hover:bg-gray-50">
            대회 개설
          </Link>
          <Link href="/champ/admin/uploads" className="block rounded-xl border p-3 hover:bg-gray-50">
            결과 업로드 (엑셀/JSON)
          </Link>
          <Link href="/champ/participate" className="block rounded-xl border p-3 hover:bg-gray-50">
            선수 등록(공개)
          </Link>
          <Link href="/champ/me" className="block rounded-xl border p-3 hover:bg-gray-50">
            내 정보(공개)
          </Link>
        </div>
      </section>

      {/* ③ 선수 관리 */}
      <section className="rounded-2xl border p-5 space-y-4 bg-white">
        <h2 className="text-xl font-bold">③ 선수 관리</h2>

        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-lg p-3"
            placeholder="이름 또는 닉네임으로 검색"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button
            onClick={search}
            disabled={loading}
            className="rounded-lg bg-emerald-700 text-white px-4 py-2 font-semibold disabled:opacity-60"
          >
            {loading ? "검색 중…" : "검색"}
          </button>
        </div>

        {list.length > 0 ? (
          <ul className="divide-y border rounded-xl">
            {list.map((p) => (
              <li
                key={p.id}
                className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold">
                    [{p.id}] {p.name}{" "}
                    <span className="text-gray-500">/ {p.dept || "소속없음"}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    닉네임: <b>{p.nickname}</b> · 핸디: {p.handicap ?? "-"} · 생성:{" "}
                    {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="임시 비밀번호"
                    className="border rounded-lg p-2 w-32"
                    id={`tpw-${p.id}`}
                  />
                  <button
                    onClick={() =>
                      resetPassword(p.id, document.getElementById(`tpw-${p.id}`).value)
                    }
                    className="rounded-lg bg-yellow-500 text-black px-3 py-2 font-semibold"
                  >
                    비번 초기화
                  </button>
                  <button
                    onClick={() => deleteParticipant(p.id)}
                    className="rounded-lg bg-rose-600 text-white px-3 py-2 font-semibold"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
        )}

        <p className="text-xs text-gray-500">
          * 동명이인은 <b>소속/닉네임/생성일/ID</b>로 구분하세요. 조작은 해당 <b>ID</b> 1명만 적용됩니다.
        </p>
      </section>
    </main>
  );
}
