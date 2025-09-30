// pages/register.js
import { useState } from "react";
import Link from "next/link";

export default function ChampRegister() {
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [nickname, setNickname] = useState("");
  const [handicap, setHandicap] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return alert("이름을 입력해주세요.");
    if (!nickname.trim()) return alert("골프존 닉네임을 입력해주세요.");

    setLoading(true);
    try {
      const r = await fetch("/api/champ/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dept: dept.trim(),
          nickname: nickname.trim(),
          handicap: handicap, // 빈 문자열이면 서버에서 무시함
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data?.error === "NICKNAME_EXISTS") {
          alert("이미 등록된 닉네임입니다. 관리자에게 문의해주세요.");
        } else if (data?.error === "NAME_AND_NICK_REQUIRED") {
          alert("이름과 닉네임은 필수입니다.");
        } else {
          alert(data?.error || "등록 실패");
        }
        return;
      }
      alert("등록되었습니다!");
      // 챔프 홈으로 이동
      window.location.assign("/champ");
    } catch (e) {
      console.error(e);
      alert("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-emerald-800 mb-6">디비온 참가 등록</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-6">
        <div>
          <label className="block font-semibold mb-1">이름 *</label>
          <input className="w-full border rounded-lg p-3" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>

        <div>
          <label className="block font-semibold mb-1">소속</label>
          <input className="w-full border rounded-lg p-3" value={dept} onChange={(e)=>setDept(e.target.value)} />
        </div>

        <div>
          <label className="block font-semibold mb-1">골프존 닉네임 *</label>
          <input className="w-full border rounded-lg p-3" value={nickname} onChange={(e)=>setNickname(e.target.value)} />
        </div>

        <div>
          <label className="block font-semibold mb-1">핸디(선택)</label>
          <input className="w-full border rounded-lg p-3" value={handicap} onChange={(e)=>setHandicap(e.target.value)} />
        </div>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-emerald-700 text-white p-3 font-semibold disabled:opacity-60"
        >
          {loading ? "등록 중…" : "등록"}
        </button>

        <div className="text-right">
          <Link href="/champ" className="text-sm text-gray-500 hover:underline">← 챔피언십 홈</Link>
        </div>
      </form>
    </main>
  );
}
