import { useState } from "react";

export default function NewEvent() {
  const [form, setForm] = useState({
    seasonTitle: "",
    eventTitle: "",
    date: "",
    course: "",
    scoring: "STROKE", // STROKE | STABLEFORD 등 확장 대비
    weight: 1,
  });
  const [loading, setLoading] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.seasonTitle.trim() || !form.eventTitle.trim()) return alert("시즌/대회명은 필수");
    setLoading(true);
    try {
      const r = await fetch("/api/champ/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "생성 실패");
      alert("대회가 생성되었습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-bold">대회 개설</h1>
      <form onSubmit={onSubmit} className="mt-4 space-y-3 rounded-2xl border bg-white p-5">
        <div>
          <label className="block text-sm font-semibold">시즌 제목 *</label>
          <input name="seasonTitle" className="w-full border rounded-xl p-3" onChange={onChange} value={form.seasonTitle}/>
        </div>
        <div>
          <label className="block text-sm font-semibold">대회 제목 *</label>
          <input name="eventTitle" className="w-full border rounded-xl p-3" onChange={onChange} value={form.eventTitle}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold">일자</label>
            <input type="date" name="date" className="w-full border rounded-xl p-3" onChange={onChange} value={form.date}/>
          </div>
          <div>
            <label className="block text-sm font-semibold">코스(선택)</label>
            <input name="course" className="w-full border rounded-xl p-3" onChange={onChange} value={form.course}/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold">스코어링</label>
            <select name="scoring" className="w-full border rounded-xl p-3" onChange={onChange} value={form.scoring}>
              <option value="STROKE">스트로크</option>
              <option value="STABLEFORD">스테이블포드</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold">포인트 가중치</label>
            <input name="weight" type="number" min="1" className="w-full border rounded-xl p-3" onChange={onChange} value={form.weight}/>
          </div>
        </div>
        <button disabled={loading} className="w-full rounded-xl bg-emerald-700 py-3 text-white font-semibold hover:bg-emerald-800">
          {loading ? "생성 중…" : "대회 생성"}
        </button>
      </form>
    </main>
  );
}
