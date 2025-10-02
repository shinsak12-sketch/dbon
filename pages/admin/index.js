// pages/admin/index.js
import { useEffect, useState } from "react";
import Uploader from "../../components/Uploader";
import Link from "next/link";

const ADMIN_PASS = "dbsonsa";

async function safeGetJSON(url, fallback) {
  try {
    const r = await fetch(url);
    if (!r.ok) return fallback;
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return fallback;
    return await r.json();
  } catch {
    return fallback;
  }
}

export default function Admin() {
  // ── 로그인 ──
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  function tryLogin(e) {
    e.preventDefault();
    if (pwd === ADMIN_PASS) setAuthed(true);
    else alert("비밀번호가 틀렸습니다.");
  }

  // ── 아코디언 ──
  const [open, setOpen] = useState({
    bg: false,
    event: true,
    notice: true,
    rules: false,
    players: false,
  });
  const toggle = (k) => setOpen((v) => ({ ...v, [k]: !v[k] }));

  // ── ① 랜딩 배경 ──
  const [bgUrl, setBgUrl] = useState("");
  const [savingBg, setSavingBg] = useState(false);
  useEffect(() => {
    safeGetJSON("/api/admin/background", {}).then((d) => setBgUrl(d?.url || ""));
  }, []);
  async function onUploaded(url) {
    try {
      setSavingBg(true);
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

  // ── ② 이번 대회 개요 ──
  const [events, setEvents] = useState([]);
  const [evForm, setEvForm] = useState({
    id: null,
    organizer: "",        // 주관부서
    name: "",             // 대회명
    manager: "",          // 부서담당자
    beginAt: "",          // 시작
    endAt: "",            // 종료
    tier: 100,            // 120/100/80
    state: "개요",         // 개요|오픈|중지|종료|결과
    mode: "스트로크",       // 스트로크|포썸
    adjust: "미적용",       // 적용|미적용
    overview: "",         // 개요
    classType: "오픈",     // 대회구분
    roundNo: "",          // 몇회
  });

  function resetEventForm() {
    setEvForm({
      id: null,
      organizer: "",
      name: "",
      manager: "",
      beginAt: "",
      endAt: "",
      tier: 100,
      state: "개요",
      mode: "스트로크",
      adjust: "미적용",
      overview: "",
      classType: "오픈",
      roundNo: "",
    });
  }

  async function loadEvents() {
    const data = await safeGetJSON("/api/admin/champ/events", { items: [] });
    setEvents(Array.isArray(data.items) ? data.items : []);
  }
  useEffect(() => { loadEvents(); }, []);

  function toISO(v) {
    if (!v) return null;
    try { return new Date(v).toISOString(); } catch { return null; }
  }

  async function saveEvent() {
    const payload = {
      admin: ADMIN_PASS,
      id: evForm.id ?? undefined,
      organizer: evForm.organizer,
      name: evForm.name,
      manager: evForm.manager,
      beginAt: toISO(evForm.beginAt),
      endAt: toISO(evForm.endAt),
      tier: Number(evForm.tier),
      state: evForm.state,
      mode: evForm.mode,
      adjust: evForm.adjust,
      overview: evForm.overview,
      classType: evForm.classType,
      roundNo: evForm.roundNo || null,
    };
    const method = evForm.id ? "PUT" : "POST";
    const r = await fetch("/api/admin/champ/events", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    alert("저장되었습니다.");
    resetEventForm();
    loadEvents();
  }

  function editEvent(e) {
    setEvForm({
      id: e.id,
      organizer: e.organizer || "",
      name: e.name || "",
      manager: e.manager || "",
      beginAt: e.beginAt ? new Date(e.beginAt).toISOString().slice(0,16) : "",
      endAt: e.endAt ? new Date(e.endAt).toISOString().slice(0,16) : "",
      tier: e.tier ?? 100,
      state: e.stateKo || e.state || "개요",
      mode: e.modeKo || e.mode || "스트로크",
      adjust: e.adjustKo || e.adjust || "미적용",
      overview: e.overview || "",
      classType: e.classTypeKo || e.classType || "오픈",
      roundNo: e.roundNo || "",
    });
  }

  async function deleteEvent(id) {
    if (!confirm("해당 대회를 삭제할까요?")) return;
    const r = await fetch("/api/admin/champ/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, id }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "삭제 실패");
    loadEvents();
  }

  // ── ③ 공지사항 ──
  const [notices, setNotices] = useState([]);
  const [ntForm, setNtForm] = useState({ id: null, title: "", content: "", pinned: false });

  async function loadNotices() {
    const data = await safeGetJSON("/api/admin/champ/notices", { items: [] });
    setNotices(Array.isArray(data.items) ? data.items : []);
  }
  useEffect(() => { loadNotices(); }, []);

  async function saveNotice() {
    const payload = { ...ntForm, admin: ADMIN_PASS };
    const method = ntForm.id ? "PUT" : "POST";
    const r = await fetch("/api/admin/champ/notices", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    alert("저장되었습니다.");
    setNtForm({ id: null, title: "", content: "", pinned: false });
    loadNotices();
  }
  function editNotice(n) {
    setNtForm({ id: n.id, title: n.title, content: n.content, pinned: !!n.pinned });
  }
  async function deleteNotice(id) {
    if (!confirm("공지사항을 삭제할까요?")) return;
    const r = await fetch("/api/admin/champ/notices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, id }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "삭제 실패");
    loadNotices();
  }

  // ── ④ 포인트 규칙 ──
  const [pointRules, setPointRules] = useState({
    base: [30, 20, 15, 12, 10, 8, 6, 4, 2, 1],
    tier: { 120: 120, 100: 100, 80: 80 },
  });
  async function loadRules() {
    const data = await safeGetJSON("/api/admin/champ/settings", null);
    if (data?.rules) setPointRules(data.rules);
  }
  useEffect(() => { loadRules(); }, []);
  async function saveRules() {
    const r = await fetch("/api/admin/champ/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, rules: pointRules }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    alert("저장되었습니다.");
  }

  // ── ⑤ 선수 관리 ──
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);

  async function search() {
    if (!q.trim()) { setList([]); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/champ/participants?q=${encodeURIComponent(q)}&admin=${ADMIN_PASS}`);
      const data = await r.json();
      if (!r.ok) return alert(data?.error || "검색 실패");
      setList(data.items || []);
    } finally { setLoading(false); }
  }
  async function resetPassword(id, tempPassword) {
    const pw = String(tempPassword || "").trim();
    if (pw.length < 4) return alert("임시 비밀번호를 4자 이상 입력하세요.");
    if (!confirm("초기화할까요?")) return;
    const r = await fetch("/api/admin/champ/participants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, id, newPassword: pw }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "초기화 실패");
    alert("완료");
    search();
  }
  async function deleteParticipant(id) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const r = await fetch("/api/admin/champ/participants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, id }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "삭제 실패");
    alert("삭제되었습니다.");
    search();
  }

  // ── 렌더 ──
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

  const chevron = (on) => (
    <span className={`ml-2 transition-transform ${on ? "rotate-180" : ""}`}>▾</span>
  );

  const orgOptions = [
    "강북부","강남부","동서울부","인천부","경기부","외제부","수도SMART부","부산부","경남부","대구부","충청부","호남부","지방SMART부","수도본부","지방본부","경영지원본부","손사지원","손사전략","네트워크","감사파트","본점","센터장","부서장","본부장","대표이사","DB손사"
  ];
  const classTypes = ["오픈","클래식","인비테이셔널","챔피언십","마스터스","챌린지","플레이오프"];

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">관리 도구</h1>
        <Link href="/champ" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          챔피언십 홈
        </Link>
      </div>

      {/* ① 랜딩 배경 */}
      <section className="rounded-2xl border bg-white">
        <button type="button" onClick={() => toggle("bg")} className="w-full flex items-center justify-between p-5 text-left">
          <h2 className="text-xl font-bold">① 랜딩 배경 바꾸기</h2>{chevron(open.bg)}
        </button>
        {open.bg && (
          <div className="p-5 pt-0 space-y-4">
            {bgUrl ? <img src={bgUrl} alt="현재 배경" className="w-full rounded-xl border" /> : <p className="text-gray-600">현재 등록된 배경이 없습니다.</p>}
            <Uploader label={savingBg ? "업로드 중…" : "이미지 업로드"} onUploaded={onUploaded} disabled={savingBg} />
          </div>
        )}
      </section>

      {/* ② 이번 대회 개요 */}
      <section className="rounded-2xl border bg-white">
        <button type="button" onClick={() => toggle("event")} className="w-full flex items-center justify-between p-5 text-left">
          <h2 className="text-xl font-bold">② 이번 대회 개요</h2>{chevron(open.event)}
        </button>

        {open.event && (
          <div className="p-5 pt-0 space-y-4">
            <div className="grid gap-3">
              <input className="border rounded-lg p-3" placeholder="몇회 (예: 제1회)" value={evForm.roundNo} onChange={(e)=>setEvForm(v=>({...v, roundNo:e.target.value}))}/>
              <select className="border rounded-lg p-3" value={evForm.organizer} onChange={(e)=>setEvForm(v=>({...v, organizer:e.target.value}))}>
                <option value="">주관부서 선택</option>
                {orgOptions.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
              <input className="border rounded-lg p-3" placeholder="대회명" value={evForm.name} onChange={(e)=>setEvForm(v=>({...v, name:e.target.value}))}/>
              <select className="border rounded-lg p-3" value={evForm.classType} onChange={(e)=>setEvForm(v=>({...v, classType:e.target.value}))}>
                {classTypes.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
              <input className="border rounded-lg p-3" placeholder="부서담당자" value={evForm.manager} onChange={(e)=>setEvForm(v=>({...v, manager:e.target.value}))}/>
              <div className="grid gap-2">
                <label className="text-xs text-gray-500">시작일</label>
                <input type="datetime-local" className="border rounded-lg p-3" value={evForm.beginAt} onChange={(e)=>setEvForm(v=>({...v, beginAt:e.target.value}))}/>
                <label className="text-xs text-gray-500">종료일</label>
                <input type="datetime-local" className="border rounded-lg p-3" value={evForm.endAt} onChange={(e)=>setEvForm(v=>({...v, endAt:e.target.value}))}/>
              </div>
              <select className="border rounded-lg p-3" value={evForm.tier} onChange={(e)=>setEvForm(v=>({...v, tier:Number(e.target.value)}))}>
                <option value={120}>메이저 (120)</option>
                <option value={100}>스탠다드 (100)</option>
                <option value={80}>라이트 (80)</option>
              </select>
              <select className="border rounded-lg p-3" value={evForm.state} onChange={(e)=>setEvForm(v=>({...v, state:e.target.value}))}>
                {["개요","오픈","중지","종료","결과"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select className="border rounded-lg p-3" value={evForm.mode} onChange={(e)=>setEvForm(v=>({...v, mode:e.target.value}))}>
                <option value="스트로크">스트로크</option>
                <option value="포썸">포썸</option>
              </select>
              <select className="border rounded-lg p-3" value={evForm.adjust} onChange={(e)=>setEvForm(v=>({...v, adjust:e.target.value}))}>
                <option value="적용">스코어보정 적용</option>
                <option value="미적용">스코어보정 미적용</option>
              </select>
              <textarea className="w-full border rounded-lg p-3" rows={4} placeholder="대회 개요" value={evForm.overview} onChange={(e)=>setEvForm(v=>({...v, overview:e.target.value}))}/>
            </div>

            <div className="flex gap-2">
              <button onClick={saveEvent} className="btn-primary">{evForm.id ? "수정" : "등록"}</button>
              {evForm.id && <button onClick={resetEventForm} className="btn-outline">새로작성</button>}
            </div>

            <div className="border rounded-xl divide-y">
              {events.length===0 && <div className="p-4 text-sm text-gray-500">등록된 대회가 없습니다.</div>}
              {events.map(e=>(
                <div key={e.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{e.name}</div>
                    <div className="text-xs text-gray-500">
                      {e.organizer || "-"} · {e.beginAt ? new Date(e.beginAt).toLocaleString() : "일정 미정"} · 티어 {e.tier}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={()=>editEvent(e)} className="btn-outline">수정</button>
                    <button onClick={()=>deleteEvent(e.id)} className="btn-outline">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ③ 공지사항 */}
      <section className="rounded-2xl border bg-white">
        <button type="button" onClick={()=>toggle("notice")} className="w-full flex items-center justify-between p-5 text-left">
          <h2 className="text-xl font-bold">③ 공지사항</h2>{chevron(open.notice)}
        </button>
        {open.notice && (
          <div className="p-5 pt-0 space-y-4">
            <input className="w-full border rounded-lg p-3" placeholder="제목" value={ntForm.title} onChange={(e)=>setNtForm(v=>({...v, title:e.target.value}))}/>
            <textarea className="w-full border rounded-lg p-3" rows={4} placeholder="내용" value={ntForm.content} onChange={(e)=>setNtForm(v=>({...v, content:e.target.value}))}/>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={ntForm.pinned} onChange={(e)=>setNtForm(v=>({...v, pinned:e.target.checked}))}/> 상단 고정
            </label>
            <div className="flex gap-2">
              <button onClick={saveNotice} className="btn-primary">{ntForm.id ? "수정" : "등록"}</button>
              {ntForm.id && <button onClick={()=>setNtForm({ id:null, title:"", content:"", pinned:false })} className="btn-outline">새로작성</button>}
            </div>

            <div className="border rounded-xl divide-y">
              {notices.length===0 && <div className="p-4 text-sm text-gray-500">공지사항이 없습니다.</div>}
              {notices.map(n=>(
                <div key={n.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{n.title} {n.pinned && <span className="badge ml-2">고정</span>}</div>
                    <div className="text-xs text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{n.content}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={()=>editNotice(n)} className="btn-outline">수정</button>
                    <button onClick={()=>deleteNotice(n.id)} className="btn-outline">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ④ 포인트 규칙 */}
      <section className="rounded-2xl border bg-white">
        <button type="button" onClick={()=>toggle("rules")} className="w-full flex items-center justify-between p-5 text-left">
          <h2 className="text-xl font-bold">④ 포인트 규칙</h2>{chevron(open.rules)}
        </button>
        {open.rules && (
          <div className="p-5 pt-0 space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border">
                <div className="font-semibold mb-2">티어 보정</div>
                {[120,100,80].map(k=>(
                  <div key={k} className="mt-2">
                    <label className="block text-sm">{k===120?"메이저":k===100?"스탠다드":"라이트"} ({k})</label>
                    <input className="w-full border rounded p-2" value={pointRules.tier[k]} onChange={(e)=>setPointRules(v=>({...v, tier:{...v.tier, [k]:Number(e.target.value)}}))}/>
                  </div>
                ))}
              </div>
              <div className="sm:col-span-2 p-3 rounded-lg border">
                <div className="font-semibold mb-2">기본 포인트(순위 배열)</div>
                <input className="w-full border rounded p-2" value={pointRules.base.join(",")} onChange={(e)=>{
                  const arr = e.target.value.split(",").map(s=>Number(s.trim())).filter(n=>!Number.isNaN(n));
                  setPointRules(v=>({...v, base:arr}));
                }}/>
                <p className="text-xs text-gray-500 mt-1">예: 30,20,15,12,10,8,6,4,2,1</p>
              </div>
            </div>
            <button onClick={saveRules} className="btn-primary">저장</button>
          </div>
        )}
      </section>

      {/* ⑤ 선수 관리 */}
      <section className="rounded-2xl border bg-white">
        <button type="button" onClick={()=>toggle("players")} className="w-full flex items-center justify-between p-5 text-left">
          <h2 className="text-xl font-bold">⑤ 선수 관리</h2>{chevron(open.players)}
        </button>
        {open.players && (
          <div className="p-5 pt-0 space-y-4">
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
          </div>
        )}
      </section>
    </main>
  );
}
