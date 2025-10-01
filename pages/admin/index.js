// pages/admin/index.js
import { useEffect, useState } from "react";
import Uploader from "../../components/Uploader";
import Link from "next/link";

const ADMIN_PASS = "dbsonsa";

/** 안전 JSON fetch (API 미구현/404일 때도 크래시 방지) */
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
  // ───── 로그인 ─────
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  function tryLogin(e) {
    e.preventDefault();
    if (pwd === ADMIN_PASS) setAuthed(true);
    else alert("비밀번호가 틀렸습니다.");
  }

  // ───── 아코디언 상태 ─────
  const [open, setOpen] = useState({
    bg: false,
    event: true,
    notice: true,
    rules: false,
    players: false,
  });
  const toggle = (k) => setOpen((v) => ({ ...v, [k]: !v[k] }));

  // ───── ① 랜딩 배경 ─────
  const [bgUrl, setBgUrl] = useState("");
  const [savingBg, setSavingBg] = useState(false);

  useEffect(() => {
    safeGetJSON("/api/admin/background", {}).then((d) => setBgUrl(d?.url || ""));
  }, []);

  async function onUploaded(url) {
    const API_READY = false; // ← 실제 API 연결 시 true로
    if (!API_READY) {
      setBgUrl(url);
      alert("(임시) 업로드 미리보기만 반영됩니다. API 연결 후 저장됩니다.");
      return;
    }
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
    } finally {
      setSavingBg(false);
    }
  }

  // ───── ② 이번 대회 개요 ─────
  const [events, setEvents] = useState([]);
  const [evForm, setEvForm] = useState({
    roundNo: "",           // 몇회
    org: "",               // 주관부서
    title: "",             // 대회명
    classType: "오픈",     // 대회구분
    manager: "",           // 부서담당자
    beginAt: "",           // 시작일시
    endAt: "",             // 종료일시
    tier: 100,             // 120/100/80
    state: "개요",         // 개요|오픈|중지|종료|결과
    mode: "스트로크",      // 스트로크|포썸
    adjust: "미적용",      // 적용|미적용
    overview: "",          // 대회개요
    id: null,              // 편집용
  });

  function resetEventForm() {
    setEvForm({
      roundNo: "",
      org: "",
      title: "",
      classType: "오픈",
      manager: "",
      beginAt: "",
      endAt: "",
      tier: 100,
      state: "개요",
      mode: "스트로크",
      adjust: "미적용",
      overview: "",
      id: null,
    });
  }

  async function loadEvents() {
    const data = await safeGetJSON("/api/admin/champ/events", { items: [] });
    setEvents(Array.isArray(data.items) ? data.items : []);
  }
  useEffect(() => {
    loadEvents();
  }, []);

  const API_READY = false; // ← 실제 API 붙일 때 true

  async function saveEvent() {
    if (!API_READY) {
      // 프론트 목록에만 반영하는 가짜 저장
      const fake = {
        id: evForm.id ?? Date.now(),
        name: evForm.title,
        slug: "",
        tier: evForm.tier,
        playedAt: evForm.beginAt || null,
        season: { name: evForm.org || "-" },
        _ui: { ...evForm },
      };
      setEvents((list) => {
        const exist = list.some((x) => x.id === fake.id);
        return exist ? list.map((x) => (x.id === fake.id ? fake : x)) : [fake, ...list];
      });
      resetEventForm();
      alert("(임시) UI에만 저장되었습니다. API 연결 후 실제로 저장됩니다.");
      return;
    }

    const method = evForm.id ? "PUT" : "POST";
    const r = await fetch("/api/admin/champ/events", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, ...evForm }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    alert("저장되었습니다.");
    resetEventForm();
    loadEvents();
  }

  function editEvent(e) {
    const u = e._ui || {};
    setEvForm({
      roundNo: u.roundNo ?? "",
      org: u.org ?? e.season?.name ?? "",
      title: u.title ?? e.name ?? "",
      classType: u.classType ?? "오픈",
      manager: u.manager ?? "",
      beginAt: u.beginAt ?? (e.playedAt ? new Date(e.playedAt).toISOString().slice(0, 16) : ""),
      endAt: u.endAt ?? "",
      tier: u.tier ?? e.tier ?? 100,
      state: u.state ?? "개요",
      mode: u.mode ?? "스트로크",
      adjust: u.adjust ?? "미적용",
      overview: u.overview ?? "",
      id: e.id,
    });
  }

  async function deleteEvent(id) {
    if (!confirm("해당 대회를 삭제할까요?")) return;
    if (!API_READY) {
      setEvents((list) => list.filter((x) => x.id !== id));
      alert("(임시) UI 목록에서만 삭제되었습니다. API 연결 후 실제 삭제됩니다.");
      return;
    }
    const r = await fetch("/api/admin/champ/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, id }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "삭제 실패");
    loadEvents();
  }

  // ───── ③ 공지사항 ─────
  const [notices, setNotices] = useState([]);
  const [ntForm, setNtForm] = useState({ id: null, title: "", content: "", pinned: false });

  async function loadNotices() {
    const data = await safeGetJSON("/api/admin/champ/notices", { items: [] });
    setNotices(Array.isArray(data.items) ? data.items : []);
  }
  useEffect(() => {
    loadNotices();
  }, []);

  async function saveNotice() {
    if (!API_READY) {
      const fake = {
        id: ntForm.id ?? Date.now(),
        title: ntForm.title,
        content: ntForm.content,
        pinned: ntForm.pinned,
        createdAt: new Date().toISOString(),
      };
      setNotices((list) => {
        const exist = list.some((x) => x.id === fake.id);
        return exist ? list.map((x) => (x.id === fake.id ? fake : x)) : [fake, ...list];
      });
      setNtForm({ id: null, title: "", content: "", pinned: false });
      alert("(임시) UI에만 저장되었습니다. API 연결 후 실제 저장됩니다.");
      return;
    }
    const method = ntForm.id ? "PUT" : "POST";
    const r = await fetch("/api/admin/champ/notices", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, ...ntForm }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    setNtForm({ id: null, title: "", content: "", pinned: false });
    loadNotices();
  }

  function editNotice(n) {
    setNtForm({ id: n.id, title: n.title, content: n.content, pinned: !!n.pinned });
  }

  async function deleteNotice(id) {
    if (!confirm("공지사항을 삭제할까요?")) return;
    if (!API_READY) {
      setNotices((list) => list.filter((x) => x.id !== id));
      return;
    }
    const r = await fetch("/api/admin/champ/notices", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, id }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "삭제 실패");
    loadNotices();
  }

  // ───── ④ 포인트 규칙 ─────
  const [pointRules, setPointRules] = useState({
    base: [30, 20, 15, 12, 10, 8, 6, 4, 2, 1],
    tier: { 120: 120, 100: 100, 80: 80 },
  });

  async function loadRules() {
    const data = await safeGetJSON("/api/admin/champ/settings", null);
    if (data?.rules) setPointRules(data.rules);
  }
  useEffect(() => {
    loadRules();
  }, []);

  async function saveRules() {
    if (!API_READY) {
      alert("(임시) UI만 저장. API 연결 후 반영됩니다.");
      return;
    }
    const r = await fetch("/api/admin/champ/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: ADMIN_PASS, rules: pointRules }),
    });
    const data = await r.json();
    if (!r.ok) return alert(data?.error || "저장 실패");
    alert("저장되었습니다.");
  }

  // ───── ⑤ 선수 관리(간단) ─────
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);

  async function search() {
    if (!q.trim()) return setList([]);
    setLoading(true);
    // UI 데모: 더미 결과
    setTimeout(() => {
      setList([
        {
          id: 1,
          name: "홍길동",
          dept: "강북부",
          nickname: "길동자",
          handicap: 12,
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }, 300);
  }
  async function resetPassword() {
    alert("(임시) API 연결 후 동작합니다.");
  }
  async function deleteParticipant() {
    alert("(임시) API 연결 후 동작합니다.");
  }

  // ───── 렌더 ─────
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

  const classOptions = [
    "오픈","클래식","인비테이셔널","챔피언십","마스터스","챌린지","플레이오프"
  ];

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
          <h2 className="text-xl font-bold">① 랜딩 배경 바꾸기</h2>
          {chevron(open.bg)}
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
          <h2 className="text-xl font-bold">② 이번 대회 개요</h2>
          {chevron(open.event)}
        </button>

        {open.event && (
          <div className="p-5 pt-0 space-y-4">
            {/* 폼 */}
            <div className="grid gap-3">
              <input
                className="border rounded-lg p-3"
                placeholder="몇회 (예: 3)"
                value={evForm.roundNo}
                onChange={(e) => setEvForm((v) => ({ ...v, roundNo: e.target.value }))}
                inputMode="numeric"
              />

              <select className="border rounded-lg p-3" value={evForm.org} onChange={(e) => setEvForm((v) => ({ ...v, org: e.target.value }))}>
                <option value="">주관부서 선택</option>
                {orgOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
              </select>

              <input className="border rounded-lg p-3" placeholder="대회명" value={evForm.title} onChange={(e) => setEvForm((v) => ({ ...v, title: e.target.value }))} />

              <select className="border rounded-lg p-3" value={evForm.classType} onChange={(e) => setEvForm((v) => ({ ...v, classType: e.target.value }))}>
                {classOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
              </select>

              <input className="border rounded-lg p-3" placeholder="부서담당자" value={evForm.manager} onChange={(e) => setEvForm((v) => ({ ...v, manager: e.target.value }))} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">시작일</label>
                  <input type="datetime-local" className="border rounded-lg p-3 w-full"
                    value={evForm.beginAt} onChange={(e) => setEvForm((v) => ({ ...v, beginAt: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">종료일</label>
                  <input type="datetime-local" className="border rounded-lg p-3 w-full"
                    value={evForm.endAt} onChange={(e) => setEvForm((v) => ({ ...v, endAt: e.target.value }))} />
                </div>
              </div>

              <select className="border rounded-lg p-3" value={evForm.tier} onChange={(e) => setEvForm((v) => ({ ...v, tier: Number(e.target.value) }))}>
                <option value={120}>메이저 (120)</option>
                <option value={100}>스탠다드 (100)</option>
                <option value={80}>라이트 (80)</option>
              </select>

              <select className="border rounded-lg p-3" value={evForm.state} onChange={(e) => setEvForm((v) => ({ ...v, state: e.target.value }))}>
                {["개요", "오픈", "중지", "종료", "결과"].map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>

              <select className="border rounded-lg p-3" value={evForm.mode} onChange={(e) => setEvForm((v) => ({ ...v, mode: e.target.value }))}>
                <option value="스트로크">스트로크</option>
                <option value="포썸">포썸</option>
              </select>

              <select className="border rounded-lg p-3" value={evForm.adjust} onChange={(e) => setEvForm((v) => ({ ...v, adjust: e.target.value }))}>
                <option value="적용">스코어보정 적용</option>
                <option value="미적용">스코어보정 미적용</option>
              </select>

              <textarea className="w-full border rounded-lg p-3" rows={4} placeholder="대회 개요"
                value={evForm.overview} onChange={(e) => setEvForm((v) => ({ ...v, overview: e.target.value }))} />
            </div>

            <div className="flex gap-2">
              <button onClick={saveEvent} className="btn-primary">{evForm.id ? "수정" : "등록"}</button>
              {evForm.id && <button onClick={resetEventForm} className="btn-outline">새로작성</button>}
            </div>

            {/* 목록 (우측 수정/삭제) */}
            <div className="border rounded-xl divide-y">
              {events.length === 0 && <div className="p-4 text-sm text-gray-500">등록된 대회가 없습니다.</div>}
              {events.map((e) => (
                <div key={e.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{e.name || e._ui?.title}</div>
                    <div className="text-xs text-gray-500">
                      {(e._ui?.roundNo ? `${e._ui.roundNo}회 · ` : "")}
                      {(e.season?.name || e._ui?.org) ?? "-"} ·{" "}
                      {e.playedAt ? new Date(e.playedAt).toLocaleString() : e._ui?.beginAt || "일정 미정"} ·{" "}
                      {e._ui?.classType || "-"} · 티어 {e.tier || e._ui?.tier}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => editEvent(e)} className="btn-outline">수정</button>
                    <button onClick={() => deleteEvent(e.id)} className="btn-outline">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ③ 공지사항 */}
      <section className="rounded-2xl border bg-white">
        <button type="button" onClick={() => toggle("notice")} className="w-full flex items-center justify-between p-5 text-left">
          <h2 className="text-xl font-bold">③ 공지사항</h2>
          {chevron(open.notice)}
        </button>
        {open.notice && (
          <div className="p-5 pt-0 space-y-4">
            <input className="w-full border rounded-lg p-3" placeholder="제목"
              value={ntForm.title} onChange={(e) => setNtForm((v) => ({ ...v, title: e.target.value }))} />
            <textarea className="w-full border rounded-lg p-3" rows={4} placeholder="내용"
              value={ntForm.content} onChange={(e) => setNtForm((v) => ({ ...v, content: e.target.value }))} />
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={ntForm.pinned} onChange={(e) => setNtForm((v) => ({ ...v, pinned: e.target.checked }))} />
              상단 고정
            </label>
            <div className="flex gap-2">
              <button onClick={saveNotice} className="btn-primary">{ntForm.id ? "수정" : "등록"}</button>
              {ntForm.id && (
                <button onClick={() => setNtForm({ id: null, title: "", content: "", pinned: false })} className="btn-outline">새로작성</button>
              )}
            </div>

            <div className="border rounded-xl divide-y">
              {notices.length === 0 && <div className="p-4 text-sm text-gray-500">공지사항이 없습니다.</div>}
              {notices.map((n) => (
                <div key={n.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      {n.title} {n.pinned && <span className="badge ml-2">고정</span>}
                    </div>
                    <div className="text-xs text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{n.content}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => editNotice(n)} className="btn-outline">수정</button>
                    <button onClick={() => deleteNotice(n.id)} className="btn-outline">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ④ 포인트 규칙 */}
      <section className="rounded-2xl border bg-white">
        <button type="button" onClick={() => toggle("rules")} className="w-full flex items-center justify-between p-5 text-left">
          <h2 className="text-xl font-bold">④ 포인트 규칙</h2>
          {chevron(open.rules)}
        </button>
        {open.rules && (
          <div className="p-5 pt-0 space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border">
                <div className="font-semibold mb-2">티어 보정</div>
                {[120, 100, 80].map((k) => (
                  <div key={k} className="mt-2">
                    <label className="block text-sm">{k === 120 ? "메이저" : k === 100 ? "스탠다드" : "라이트"} ({k})</label>
                    <input
                      className="w-full border rounded p-2"
                      value={pointRules.tier[k]}
                      onChange={(e) => setPointRules((v) => ({ ...v, tier: { ...v.tier, [k]: Number(e.target.value) } }))}
                    />
                  </div>
                ))}
              </div>
              <div className="sm:col-span-2 p-3 rounded-lg border">
                <div className="font-semibold mb-2">기본 포인트(순위 배열)</div>
                <input
                  className="w-full border rounded p-2"
                  value={pointRules.base.join(",")}
                  onChange={(e) => {
                    const arr = e.target.value.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
                    setPointRules((v) => ({ ...v, base: arr }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">예: 30,20,15,12,10,8,6,4,2,1</p>
              </div>
            </div>
            <button onClick={saveRules} className="btn-primary">저장</button>
          </div>
        )}
      </section>

      {/* ⑤ 선수 관리 */}
      <section className="rounded-2xl border bg-white">
        <button type="button" onClick={() => toggle("players")} className="w-full flex items-center justify-between p-5 text-left">
          <h2 className="text-xl font-bold">⑤ 선수 관리</h2>
        </button>
        {open.players && (
          <div className="p-5 pt-0 space-y-4">
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg p-3" placeholder="이름 또는 닉네임"
                value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
              <button onClick={search} disabled={loading} className="btn-primary">{loading ? "검색 중…" : "검색"}</button>
            </div>

            {list.length > 0 ? (
              <ul className="divide-y border rounded-xl">
                {list.map((p) => (
                  <li key={p.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">[{p.id}] {p.name} <span className="text-gray-500">/ {p.dept || "소속없음"}</span></div>
                      <div className="text-sm text-gray-600">닉: <b>{p.nickname}</b> · 핸디: {p.handicap ?? "-"} · 생성: {new Date(p.createdAt).toLocaleDateString("ko-KR")}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="text" placeholder="임시 비번" className="border rounded-lg p-2 w-32" />
                      <button onClick={resetPassword} className="rounded-lg bg-yellow-500 text-black px-3 py-2 font-semibold">비번 초기화</button>
                      <button onClick={deleteParticipant} className="rounded-lg bg-rose-600 text-white px-3 py-2 font-semibold">삭제</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
            )}
          </div>
        )}
      </section>
    </main>
  );
          }
