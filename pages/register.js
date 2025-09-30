import { useState } from "react";

export default function Register() {
  const [form, setForm] = useState({ name: "", dept: "", nickname: "", handicap: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.nickname.trim()) {
      alert("이름과 닉네임은 필수입니다.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/championship/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          dept: form.dept.trim() || null,
          nickname: form.nickname.trim(),
          handicap: form.handicap ? Number(form.handicap) : null,
        }),
      });
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "등록 실패");
      alert("등록 완료!");
      setForm({ name: "", dept: "", nickname: "", handicap: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-emerald-800">디비온 참가 등록</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold">이름 *</label>
          <input name="name" value={form.name} onChange={onChange} className="w-full border rounded-lg p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold">소속</label>
          <input name="dept" value={form.dept} onChange={onChange} className="w-full border rounded-lg p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold">골프존 닉네임 *</label>
          <input name="nickname" value={form.nickname} onChange={onChange} className="w-full border rounded-lg p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold">핸디(선택)</label>
          <input type="number" step="0.1" name="handicap" value={form.handicap} onChange={onChange} className="w-full border rounded-lg p-3" />
        </div>
        <button disabled={loading} className="w-full rounded-xl bg-emerald-700 text-white py-3 font-semibold">
          {loading ? "등록 중…" : "등록"}
        </button>
      </form>
    </main>
  );
}
