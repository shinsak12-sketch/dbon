import { useState } from "react";

export default function UploadResults() {
  const [eventId, setEventId] = useState("");
  const [rows, setRows] = useState([]); // {nickname, gross, net, etc}
  const [jsonText, setJsonText] = useState("");

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = (await import("xlsx")).default; // npm i xlsx
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const arr = XLSX.utils.sheet_to_json(ws, { defval: "" });
      // 기대 컬럼: 닉네임, Gross, Net 등 → 필요에 맞춰 key 매핑
      const mapped = arr.map((r) => ({
        nickname: String(r["닉네임"] || r["닉"] || r["NICK"] || "").trim(),
        gross: Number(r["Gross"] ?? r["그로스"] ?? 0),
        net: Number(r["Net"] ?? r["넷"] ?? 0),
      })).filter(r => r.nickname);
      setRows(mapped);
      setJsonText(JSON.stringify(mapped, null, 2));
    } catch (e) {
      console.error(e);
      alert("엑셀 파싱 실패. JSON 탭으로 업로드하세요.");
    }
  };

  const onSubmit = async () => {
    if (!eventId) return alert("eventId 입력");
    let payload;
    try {
      payload = jsonText ? JSON.parse(jsonText) : rows;
    } catch {
      return alert("JSON이 올바르지 않습니다.");
    }
    const r = await fetch(`/api/champ/events/${eventId}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: payload }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "업로드 실패");
    alert(`처리 완료: ${data.matched}명 매칭, ${data.ignored}명 무시`);
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">결과 업로드</h1>
      <div className="mt-4 rounded-2xl border bg-white p-4 space-y-3">
        <input placeholder="eventId" className="w-full border rounded-xl p-3" value={eventId} onChange={(e)=>setEventId(e.target.value)} />
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border p-3">
            <div className="font-semibold mb-2">엑셀 업로드(.xlsx)</div>
            <input type="file" accept=".xlsx" onChange={onFile}/>
          </div>
          <div className="rounded-xl border p-3">
            <div className="font-semibold mb-2">혹은 JSON 붙여넣기</div>
            <textarea rows={12} className="w-full border rounded-xl p-2 font-mono text-sm" value={jsonText} onChange={(e)=>setJsonText(e.target.value)} />
          </div>
        </div>
        <button onClick={onSubmit} className="rounded-xl bg-emerald-700 px-4 py-3 text-white font-semibold hover:bg-emerald-800">
          업로드 실행
        </button>
      </div>
    </main>
  );
}
