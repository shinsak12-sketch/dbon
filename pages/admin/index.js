import { useEffect, useState } from "react";
import Uploader from "../../components/Uploader";
import Link from "next/link";

const ADMIN_PASS = "dbsonsa";

export default function Admin() {
  // 로그인
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  function tryLogin(e) {
    e.preventDefault();
    if (pwd === ADMIN_PASS) setAuthed(true);
    else alert("비밀번호가 틀렸습니다.");
  }

  // 배경 이미지
  const [bgUrl, setBgUrl] = useState("");
  const [savingBg, setSavingBg] = useState(false);
  useEffect(() => {
    fetch("/api/admin/background")
      .then((r) => r.json())
      .then((d) => setBgUrl(d?.url || ""))
      .catch(() => {});
  }, []);
  async function onUploaded(url) {
    setSavingBg(true);
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
      setSavingBg(false);
    }
  }

  // ====== 챔피언십: 대회 개요 ======
  const [events, setEvents] = useState([]);
  const [evForm, setEvForm] = useState({
    id: null, seasonId: "", name: "", slug: "",
    playedAt: "", status: "open", tier: 100,
    overview: "", rules: "", prizes: ""
  });
  async function loadEvents() {
    const r = await fetch("/api/champ/admin/events");
    const data = await r.json();
    setEvents(data.items || []);
  }
  useEffect(() => { loadEvents(); }, []);
  async function saveEvent() {
    const payload = { ...evForm, admin: ADMIN_PASS };
    const url = "/api/champ/admin/events";
    const method = evForm.id ? "PUT" : "POST";
    const r = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    alert("저장되었습니다.");
    setEvForm({ id: null, seasonId: "", name: "", slug: "", playedAt: "", status: "open", tier: 100, overview: "", rules: "", prizes: "" });
    loadEvents();
  }
  function editEvent(e) {
    setEvForm({
      id: e.id, seasonId: e.season?.id || "",
      name: e.name, slug: e.slug,
      playedAt: e.playedAt ? new Date(e.playedAt).toISOString().slice(0,16) : "",
      status: e.status, tier: e.tier,
      overview: e.overview || "", rules: e.rules || "", prizes: e.prizes || ""
    });
  }

  // ====== 공지사항 ======
  const [notices, setNotices] = useState([]);
  const [ntForm, setNtForm] = useState({ id: null, title: "", content: "", pinned: false });
  async function loadNotices() {
    const r = await fetch("/api/champ/admin/notices");
    const data = await r.json();
    setNotices(data.items || []);
  }
  useEffect(() => { loadNotices(); }, []);
  async function saveNotice() {
    const payload = { ...ntForm, admin: ADMIN_PASS };
    const method = ntForm.id ? "PUT" : "POST";
    const r = await fetch("/api/champ/admin/notices", {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    alert("저장되었습니다.");
    setNtForm({ id: null, title: "", content: "", pinned: false });
    loadNotices();
  }
  async function deleteNotice(id) {
    if (!confirm("삭제할까요?")) return;
    const r = await fetch("/api/champ/admin/notices", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, id }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "삭제 실패");
    loadNotices();
  }
  function editNotice(n) {
    setNtForm({ id: n.id, title: n.title, content: n.content, pinned: !!n.pinned });
  }

  // ====== 포인트 규칙 ======
  const [pointRules, setPointRules] = useState({ base: [30,20,15,12,10,8,6,4,2,1], tier: {120:120,100:100,80:80} });
  async function loadRules() {
    const r = await fetch("/api/champ/admin/settings");
    const data = await r.json();
    if (data?.rules) setPointRules(data.rules);
  }
  useEffect(() => { loadRules(); }, []);
  async function saveRules() {
    const r = await fetch("/api/champ/admin/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, rules: pointRules }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    alert("저장되었습니다.");
  }

  // ====== 선수 관리(기존) ======
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  async function search() {
    if (!q.trim()) { setList([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/champ/admin/participants?q=${encodeURIComponent(q)}&admin=${ADMIN_PASS}`);
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "검색 실패");
      setList(data.items || []);
    } finally { setLoading(false); }
  }
  async function resetPassword(id, tempPassword) {
    const pw = String(tempPassword || "").trim();
    if (pw.length < 4) return alert("임시 비밀번호를 4자 이상 입력하세요.");
    if (!confirm("초기화할까요?")) return;
    const r = await fetch("/api/champ/admin/participants", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, id, newPassword: pw }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "초기화 실패");
    alert("완료");
    search();
  }
  async function deleteParticipant(id) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const r = await fetch("/api/champ/admin/participants", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, id }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "삭제 실패");
    alert("삭제되었습니다.");
    search();
  }

  if (!authed) {
    return (
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">관리자 로그인</h1>
        <form onSubmit={tryLogin} className="space-y-3">
          <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="비밀번호" className="w-full border rounded-lg p-3" />
          <button className="w-full rounded-lg bg-emerald-700 text-white p-3 font-semibold">들어가기</button>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">관리 도구</h1>
        <Link href="/champ" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">챔피언십 홈</Link>
      </div>

      {/* ① 랜딩 배경 */}
      <section className="rounded-2xl border p-5 space-y-4 bg-white">
        <h2 className="text-xl font-bold">① 랜딩 배경 바꾸기</h2>
        {bgUrl ? <img src={bgUrl} alt="현재 배경" className="w-full rounded-xl border" /> : <p className="text-gray-600">현재 등록된 배경이 없습니다.</p>}
        <Uploader label={savingBg ? "업로드 중…" : "이미지 업로드"} onUploaded={onUploaded} disabled={savingBg} />
      </section>

      {/* ② 대회 개요 */}
      <section className="rounded-2xl border p-5 space-y-4 bg-white">
        <h2 className="text-xl font-bold">② 이번 대회 개요</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <input className="border rounded-lg p-3" placeholder="시즌 ID" value={evForm.seasonId} onChange={e=>setEvForm(v=>({...v, seasonId:e.target.value}))}/>
          <input className="border rounded-lg p-3" placeholder="대회명 (예: 1월 강북부 오픈)" value={evForm.name} onChange={e=>setEvForm(v=>({...v, name:e.target.value}))}/>
          <input className="border rounded-lg p-3" placeholder="슬러그 (예: 2025-r1)" value={evForm.slug} onChange={e=>setEvForm(v=>({...v, slug:e.target.value}))}/>
          <input type="datetime-local" className="border rounded-lg p-3" value={evForm.playedAt} onChange={e=>setEvForm(v=>({...v, playedAt:e.target.value}))}/>
          <select className="border rounded-lg p-3" value={evForm.status} onChange={e=>setEvForm(v=>({...v, status:e.target.value}))}>
            <option value="draft">draft</option><option value="open">open</option><option value="closed">closed</option><option value="published">published</option>
          </select>
          <select className="border rounded-lg p-3" value={evForm.tier} onChange={e=>setEvForm(v=>({...v, tier:Number(e.target.value)}))}>
            <option value={120}>메이저(120)</option>
            <option value={100}>스탠다드(100)</option>
            <option value={80}>라이트(80)</option>
          </select>
        </div>

        <textarea className="w-full border rounded-lg p-3" rows={3} placeholder="개요" value={evForm.overview} onChange={e=>setEvForm(v=>({...v, overview:e.target.value}))}/>
        <textarea className="w-full border rounded-lg p-3" rows={3} placeholder="경기방식" value={evForm.rules} onChange={e=>setEvForm(v=>({...v, rules:e.target.value}))}/>
        <textarea className="w-full border rounded-lg p-3" rows={3} placeholder="상품" value={evForm.prizes} onChange={e=>setEvForm(v=>({...v, prizes:e.target.value}))}/>

        <div className="flex gap-2">
          <button onClick={saveEvent} className="btn-primary">저장</button>
          {evForm.id && <button onClick={()=>setEvForm({ id:null, seasonId:"", name:"", slug:"", playedAt:"", status:"open", tier:100, overview:"", rules:"", prizes:""})} className="btn-outline">새로작성</button>}
        </div>

        <div className="border rounded-xl divide-y">
          {events.map(e=>(
            <div key={e.id} className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-semibold">{e.name} <span className="text-xs text-gray-500">/{e.slug}</span></div>
                <div className="text-sm text-gray-500">
                  {e.season?.name ?? '-'} · {e.playedAt ? new Date(e.playedAt).toLocaleString() : '일자 미정'} · 티어 {e.tier}
                </div>
              </div>
              <button onClick={()=>editEvent(e)} className="btn-outline">편집</button>
            </div>
          ))}
        </div>
      </section>

      {/* ③ 공지사항 */}
      <section className="rounded-2xl border p-5 space-y-4 bg-white">
        <h2 className="text-xl font-bold">③ 공지사항</h2>
        <input className="w-full border rounded-lg p-3" placeholder="제목" value={ntForm.title} onChange={e=>setNtForm(v=>({...v, title:e.target.value}))}/>
        <textarea className="w-full border rounded-lg p-3" rows={4} placeholder="내용" value={ntForm.content} onChange={e=>setNtForm(v=>({...v, content:e.target.value}))}/>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={ntForm.pinned} onChange={e=>setNtForm(v=>({...v, pinned:e.target.checked}))}/>
          상단 고정
        </label>
        <div className="flex gap-2">
          <button onClick={saveNotice} className="btn-primary">{ntForm.id ? "수정" : "등록"}</button>
          {ntForm.id && <button onClick={()=>setNtForm({ id:null, title:"", content:"", pinned:false })} className="btn-outline">새로작성</button>}
        </div>

        <div className="border rounded-xl divide-y">
          {notices.map(n=>(
            <div key={n.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{n.title} {n.pinned && <span className="badge ml-2">고정</span>}</div>
                <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{n.content}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={()=>editNotice(n)} className="btn-outline">편집</button>
                <button onClick={()=>deleteNotice(n.id)} className="btn-outline">삭제</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ④ 포인트 규칙 */}
      <section className="rounded-2xl border p-5 space-y-4 bg-white">
        <h2 className="text-xl font-bold">④ 포인트 규칙</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border">
            <div className="font-semibold mb-2">티어 보정</div>
            <label className="block text-sm">메이저(120)</label>
            <input className="w-full border rounded p-2" value={pointRules.tier[120]} onChange={e=>setPointRules(v=>({...v, tier:{...v.tier, 120:Number(e.target.value)}}))}/>
            <label className="block text-sm mt-2">스탠다드(100)</label>
            <input className="w-full border rounded p-2" value={pointRules.tier[100]} onChange={e=>setPointRules(v=>({...v, tier:{...v.tier, 100:Number(e.target.value)}}))}/>
            <label className="block text-sm mt-2">라이트(80)</label>
            <input className="w-full border rounded p-2" value={pointRules.tier[80]} onChange={e=>setPointRules(v=>({...v, tier:{...v.tier, 80:Number(e.target.value)}}))}/>
          </div>
          <div className="sm:col-span-2 p-3 rounded-lg border">
            <div className="font-semibold mb-2">기본 포인트(순위 배열)</div>
            <input className="w-full border rounded p-2" value={pointRules.base.join(',')} onChange={e=>{
              const arr = e.target.value.split(',').map(s=>Number(s.trim())).filter(n=>!Number.isNaN(n));
              setPointRules(v=>({...v, base: arr}));
            }}/>
            <p className="text-xs text-gray-500 mt-1">예시: 30,20,15,12,10,8,6,4,2,1</p>
          </div>
        </div>
        <button onClick={saveRules} className="btn-primary">저장</button>
      </section>

      {/* ⑤ 선수 관리 (검색/비번초기화/삭제) */}
      <section className="rounded-2xl border p-5 space-y-4 bg-white">
        <h2 className="text-xl font-bold">⑤ 선수 관리</h2>
        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg p-3" placeholder="이름 또는 닉네임" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&search()}/>
          <button onClick={search} disabled={loading} className="btn-primary">{loading?'검색 중…':'검색'}</button>
        </div>
        {list.length>0 ? (
          <ul className="divide-y border rounded-xl">
            {list.map(p=>(
              <li key={p.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">[{p.id}] {p.name} <span className="text-gray-500">/ {p.dept || "소속없음"}</span></div>
                  <div className="text-sm text-gray-600">닉: <b>{p.nickname}</b> · 핸디: {p.handicap ?? "-"} · 생성: {new Date(p.createdAt).toLocaleDateString("ko-KR")}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="임시 비번" className="border rounded-lg p-2 w-32" id={`tpw-${p.id}`}/>
                  <button onClick={()=>resetPassword(p.id, document.getElementById(`tpw-${p.id}`).value)} className="rounded-lg bg-yellow-500 text-black px-3 py-2 font-semibold">비번 초기화</button>
                  <button onClick={()=>deleteParticipant(p.id)} className="rounded-lg bg-rose-600 text-white px-3 py-2 font-semibold">삭제</button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>}
      </section>
    </main>
  );
      }
