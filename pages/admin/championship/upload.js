import { useEffect, useState } from "react";

export default function UploadScores() {
  const [seasons, setSeasons] = useState([]);
  const [eventId, setEventId] = useState("");
  const [file64, setFile64] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/championship/seasons");
      const data = await r.json();
      if (r.ok) setSeasons(data.seasons || []);
    })();
  }, []);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setFile64(String(reader.result));
    reader.readAsDataURL(f);
  };

  const onUpload = async () => {
    if (!eventId || !file64) return alert("라운드와 파일을 선택하세요.");
    setLoading(true);
    try {
      const r = await fetch("/api/championship/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: Number(eventId), fileBase64: file64 }),
      });
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "업로드 실패");
      alert(`저장: ${data.saved}건 / 스킵: ${data.skipped}건`);
      setFile64("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-emerald-800">라운드 성적 업로드</h1>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold">라운드 선택</label>
          <select
            className="w-full border rounded-lg p-3"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">선택…</option>
            {seasons.map((s) => (
              <optgroup key={s.id} label={`${s.year} ${s.name}`}>
                {s.events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} {ev.playedAt ? `(${new Date(ev.playedAt).toLocaleDateString()})` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold">엑셀 파일(.xlsx)</label>
          <input type="file" accept=".xlsx,.xls" onChange={onFile} className="w-full" />
        </div>

        <button
          onClick={onUpload}
          disabled={loading || !eventId || !file64}
          className="rounded-xl bg-emerald-700 text-white px-4 py-3 font-semibold"
        >
          {loading ? "업로드 중…" : "업로드"}
        </button>
      </div>
    </main>
  );
}
