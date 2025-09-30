// pages/champ/me.js
import { useState } from "react";
import Link from "next/link";

export default function ChampMe() {
  const [step, setStep] = useState("login"); // login | view
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [me, setMe] = useState(null);
  const [scores, setScores] = useState([]);
  const [saving, setSaving] = useState(false);
  const [nick, setNick] = useState("");
  const [dept, setDept] = useState("");
  const [handi, setHandi] = useState("");
  const [newPw, setNewPw] = useState("");

  async function login(e) {
    e.preventDefault();
    try {
      const r = await fetch("/api/champ/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data?.error || "인증 실패");
        return;
      }
      setMe(data.me);
      setScores(data.scores || []);
      setNick(data.me.nickname || "");
      setDept(data.me.dept || "");
      setHandi(data.me.handicap ?? "");
      setStep("view");
    } catch {
      alert("네트워크 오류");
    }
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch("/api/champ/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          password,
          dept,
          nickname: nick,
          handicap: String(handi),
          newPassword: newPw,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data?.error || "수정 실패");
        return;
      }
      alert("저장되었습니다.");
      setMe(data.me);
      setNewPw("");
    } finally {
      setSaving(false);
    }
  }

  if (step === "login") {
    return (
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-3xl font-extrabold text-emerald-800 mb-6">내 정보</h1>
        <form onSubmit={login} className="space-y-4 rounded-2xl border bg-white p-6">
          <div>
            <label className="block font-semibold mb-1">이름</label>
            <input className="w-full border rounded-lg p-3" value={name} onChange={(e)=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block font-semibold mb-1">비밀번호</label>
            <input type="password" className="w-full border rounded-lg p-3" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <button className="w-full rounded-xl bg-emerald-700 text-white p-3 font-semibold">확인</button>
          <div className="text-right">
            <Link href="/champ" className="text-sm text-gray-500 hover:underline">← 챔피언십 홈</Link>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-emerald-800">내 정보</h1>
        <Link href="/champ" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">← 챔피언십 홈</Link>
      </header>

      <section className="rounded-2xl border bg-white p-6 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold">이름</label>
            <div className="rounded-lg border p-3 bg-gray-50">{me?.name}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold">닉네임</label>
            <input className="w-full border rounded-lg p-3" value={nick} onChange={(e)=>setNick(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold">소속</label>
            <input className="w-full border rounded-lg p-3" value={dept} onChange={(e)=>setDept(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold">핸디</label>
            <input className="w-full border rounded-lg p-3" value={handi} onChange={(e)=>setHandi(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold">새 비밀번호 (변경 시)</label>
            <input type="password" className="w-full border rounded-lg p-3" value={newPw} onChange={(e)=>setNewPw(e.target.value)} />
          </div>
        </div>
        <div className="text-right">
          <button onClick={save} disabled={saving} className="rounded-lg bg-emerald-700 text-white px-4 py-2 font-semibold disabled:opacity-60">
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-bold mb-3">대회 기록</h2>
        {scores.length === 0 ? (
          <p className="text-gray-500">등록된 기록이 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {scores.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-semibold">{s.event?.season?.name} · {s.event?.name}</div>
                  <div className="text-sm text-gray-500">
                    {s.event?.season?.year} / {s.event?.playedAt ? new Date(s.event.playedAt).toLocaleDateString("ko-KR") : "일자 미정"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{s.strokes}타</div>
                  <div className="text-sm text-gray-500">{s.points} pts</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
