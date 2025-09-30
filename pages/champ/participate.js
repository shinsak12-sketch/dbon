import { useState } from "react";

export default function Participate() {
  const [form, setForm] = useState({ name: "", dept: "", nickname: "", handicap: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.nickname.trim()) return alert("이름/닉네임은 필수입니다.");
    setLoading(true);
    try {
      const r = await fetch("/api/champ/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "등록 실패");
      alert("등록 완료!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">참가 등록</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border bg-white p-5">
        <div>
          <label className="block text-sm font-semibold">이름 *</label>
          <input name="name" className="w-full border rounded-xl p-3" onChange={onChange} value={form.name}/>
        </div>
        <div>
          <label className="block text-sm font-semibold">소속</label>
          <input name="dept" className="w-full border rounded-xl p-3" onChange={onChange} value={form.dept}/>
        </div>
        <div>
          <label className="block text-sm font-semibold">골프존 닉네임 *</label>
          <input name="nickname" className="w-full border rounded-xl p-3" onChange={onChange} value={form.nickname}/>
        </div>
        <div>
          <label className="block text-sm font-semibold">핸디(선택)</label>
          <input name="handicap" className="w-full border rounded-xl p-3" onChange={onChange} value={form.handicap}/>
        </div>
        <button disabled={loading} className="w-full rounded-xl bg-emerald-700 py-3 text-white font-semibold hover:bg-emerald-800">
          {loading ? "등록 중…" : "등록"}
        </button>
      </form>
    </main>
  );
}
