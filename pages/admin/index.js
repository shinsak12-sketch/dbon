// pages/admin/index.js
import { useEffect, useState } from "react";
import Uploader from "../../components/Uploader";
import Link from "next/link";

const ADMIN_PASS = "dbsonsa";

// 주관부서 옵션
const ORG_DEPTS = [
  "강북부","강남부","동서울부","인천부","경기부","외제부","수도SMART부",
  "부산부","경남부","대구부","충청부","호남부","지방SMART부",
  "수도본부","지방본부","경영지원본부","손사지원","손사전략","네트워크","감사파트",
  "본점","센터장","부서장","본부장","대표이사","DB손사"
];

// 품격(티어) · 상태 · 방식 · 스코어보정 옵션
const TIER_OPTIONS = [
  { value: 120, label: "메이저 (120)" },
  { value: 100, label: "스탠다드 (100)" },
  { value: 80,  label: "라이트 (80)" },
];

const OPEN_STATUS_OPTIONS = [
  { value: "overview", label: "개요" },
  { value: "open",     label: "오픈" },
  { value: "paused",   label: "중지" },
  { value: "closed",   label: "종료" },
  { value: "result",   label: "결과" },
];

const GAME_TYPE_OPTIONS = [
  { value: "stroke",  label: "스트로크" },
  { value: "foursome",label: "포썸" },
];

const ADJUST_OPTIONS = [
  { value: "on",  label: "적용" },
  { value: "off", label: "미적용" },
];

export default function Admin() {
  // ───────────────── 로그인
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  function tryLogin(e) {
    e.preventDefault();
    if (pwd === ADMIN_PASS) setAuthed(true);
    else alert("비밀번호가 틀렸습니다.");
  }

  // ───────────────── 랜딩 배경
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

  // ───────────────── 챔피언십: 이번 대회 개요 (요청한 9개 필드)
  const [events, setEvents] = useState([]);

  // 폼 상태
  const emptyEvForm = {
    id: null,
    orgDept: "",          // 1) 주관부서 (드롭다운)
    eventName: "",        // 2) 대회명
    managerName: "",      // 3) 부서담당자
    startAt: "",          // 4) 기간-시작
    endAt: "",            // 4) 기간-종료
    tier: 100,            // 5) 대회품격(120/100/80)
    openStatus: "overview", // 6) 오픈여부
    gameType: "stroke",   // 7) 대회방식
    scoreAdjust: "on",    // 8) 스코어보정
    overview: "",         // 9) 대회개요(서술)
  };
  const [evForm, setEvForm] = useState(emptyEvForm);

  async function loadEvents() {
    // 목록은 서버 스키마에 맞게 응답해준다고 가정(새 필드 이름들)
    const r = await fetch("/api/champ/admin/events");
    const data = await r.json();
    setEvents(Array.isArray(data.items) ? data.items : []);
  }
  useEffect(() => { loadEvents(); }, []);

  // 저장
  async function saveEvent() {
    // 간단 검증
    if (!evForm.orgDept) return alert("주관부서를 선택하세요.");
    if (!evForm.eventName.trim()) return alert("대회명을 입력하세요.");
    if (!evForm.managerName.trim()) return alert("부서담당자를 입력하세요.");
    if (!evForm.startAt || !evForm.endAt) return alert("대회기간(시작/종료)을 입력하세요.");

    const payload = { ...evForm, admin: ADMIN_PASS };
    const method = evForm.id ? "PUT" : "POST";
    const r = await fetch("/api/champ/admin/events", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    alert("저장되었습니다.");
    setEvForm(emptyEvForm);
    loadEvents();
  }

  // 편집
  function editEvent(e) {
    setEvForm({
      id: e.id ?? null,
      orgDept: e.orgDept || "",
      eventName: e.eventName || "",
      managerName: e.managerName || "",
      startAt: e.startAt ? new Date(e.startAt).toISOString().slice(0,16) : "",
      endAt:   e.endAt   ? new Date(e.endAt).toISOString().slice(0,16)   : "",
      tier: e.tier ?? 100,
      openStatus: e.openStatus || "overview",
      gameType: e.gameType || "stroke",
      scoreAdjust: e.scoreAdjust || "on",
      overview: e.overview || "",
    });
  }

  // ───────────────── 공지사항
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

  // ───────────────── 포인트 규칙(기존)
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

  // ───────────────── 선수 관리(기존)
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

  // ───────────────── UI
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

      {/* ② 이번 대회 개요 (요청 9개 필드) */}
      <section className="rounded-2xl border p-5 space-y-4 bg-white">
        <h2 className="text-xl font-bold">② 이번 대회 개요</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* 1. 주관부서 */}
          <select
            className="border rounded-lg p-3"
            value={evForm.orgDept}
            onChange={(e)=>setEvForm(v=>({...v, orgDept:e.target.value}))}
          >
            <option value="">주관부서 선택</option>
            {ORG_DEPTS.map((d)=>(
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* 2. 대회명 */}
          <input
            className="border rounded-lg p-3"
            placeholder="대회명"
            value={evForm.eventName}
            onChange={(e)=>setEvForm(v=>({...v, eventName:e.target.value}))}
          />

          {/* 3. 부서담당자 */}
          <input
            className="border rounded-lg p-3"
            placeholder="부서담당자"
            value={evForm.managerName}
            onChange={(e)=>setEvForm(v=>({...v, managerName:e.target.value}))}
          />

          {/* 4. 대회기간 */}
          <input
            type="datetime-local"
            className="border rounded-lg p-3"
            value={evForm.startAt}
            onChange={(e)=>setEvForm(v=>({...v, startAt:e.target.value}))}
          />
          <input
            type="datetime-local"
            className="border rounded-lg p-3"
            value={evForm.endAt}
            onChange={(e)=>setEvForm(v=>({...v, endAt:e.target.value}))}
          />

          {/* 5. 대회품격 */}
          <select
            className="border rounded-lg p-3"
            value={evForm.tier}
            onChange={(e)=>setEvForm(v=>({...v, tier:Number(e.target.value)}))}
          >
            {TIER_OPTIONS.map(t=>(
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* 6. 오픈여부 */}
          <select
            className="border rounded-lg p-3"
            value={evForm.openStatus}
            onChange={(e)=>setEvForm(v=>({...v, openStatus:e.target.value}))}
          >
            {OPEN_STATUS_OPTIONS.map(o=>(
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* 7. 대회방식 */}
          <select
            className="border rounded-lg p-3"
            value={evForm.gameType}
            onChange={(e)=>setEvForm(v=>({...v, gameType:e.target.value}))}
          >
            {GAME_TYPE_OPTIONS.map(o=>(
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* 8. 스코어보정 */}
          <select
            className="border rounded-lg p-3"
            value={evForm.scoreAdjust}
            onChange={(e)=>setEvForm(v=>({...v, scoreAdjust:e.target.value}))}
          >
            {ADJUST_OPTIONS.map(o=>(
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* 9. 대회개요(서술) */}
        <textarea
          className="w-full border rounded-lg p-3"
          rows={4}
          placeholder="대회개요"
          value={evForm.overview}
          onChange={(e)=>setEvForm(v=>({...v, overview:e.target.value}))}
        />

        <div className="flex gap-2">
          <button onClick={saveEvent} className="btn-primary">저장</button>
          {evForm.id && (
            <button
              onClick={()=>setEvForm(emptyEvForm)}
              className="btn-outline"
            >
              새로작성
            </button>
          )}
        </div>

        {/* 목록 */}
        <div className="border rounded-xl divide-y">
          {events.map((e)=>(
            <div key={e.id} className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-semibold">
                  {e.eventName}
                  <span className="ml-2 text-xs text-gray-500">/ {e.orgDept}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {e.startAt ? new Date(e.startAt).toLocaleString() : "시작 미정"} ~ {e.endAt ? new Date(e.endAt).toLocaleString() : "종료 미정"}
                  {" · "}품격 {e.tier}
                  {" · "}{OPEN_STATUS_OPTIONS.find(x=>x.value===e.openStatus)?.label ?? e.openStatus}
                  {" · "}{GAME_TYPE_OPTIONS.find(x=>x.value===e.gameType)?.label ?? e.gameType}
                  {" · "}{e.scoreAdjust==="on"?"보정 적용":"보정 미적용"}
                </div>
              </div>
              <button onClick={()=>editEvent(e)} className="btn-outline">편집</button>
            </div>
          ))}
          {events.length===0 && (
            <div className="p-3 text-sm text-gray-500">등록된 대회가 없습니다.</div>
          )}
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
          {notices.length===0 && <div className="p-3 text-sm text-gray-500">공지 없음</div>}
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

      {/* ⑤ 선수 관리 */}
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
