// pages/champ/me.js
import { useState } from "react";
import Link from "next/link";

export default function ChampMe() {
  // login | setpwd | view
  const [step, setStep] = useState("login");

  // 로그인 입력
  const [name, setName] = useState("");
  const [loginNickname, setLoginNickname] = useState(""); // 동명이인일 때만 사용
  const [password, setPassword] = useState("");
  const [needNickname, setNeedNickname] = useState(false);
  const [working, setWorking] = useState(false);

  // 최초 비번 설정 입력
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [setPwdNickname, setSetPwdNickname] = useState("");

  // 내 정보/기록
  const [me, setMe] = useState(null);
  const [scores, setScores] = useState([]);

  // 수정 폼 값
  const [nick, setNick] = useState("");
  const [dept, setDept] = useState("");
  const [handi, setHandi] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPwForChange, setNewPwForChange] = useState("");

  // ✅ 참가자 구분/가족명
  const [ptype, setPtype] = useState("EMPLOYEE"); // EMPLOYEE | FAMILY
  const [familyName, setFamilyName] = useState("");

  /* ----------------- 액션 ----------------- */

  // 로그인
  async function login(e) {
    e?.preventDefault();
    if (!name.trim() || !password) return alert("이름과 비밀번호를 입력하세요.");
    setWorking(true);
    try {
      const r = await fetch("/api/champ/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password,
          nickname: needNickname ? (loginNickname.trim() || undefined) : undefined,
        }),
      });
      const data = await r.json();

      if (!r.ok) {
        if (data?.error === "AMBIGUOUS_NAME_NEED_NICKNAME") {
          setNeedNickname(true);
          requestAnimationFrame(() =>
            document.getElementById("login-nickname")?.focus()
          );
          alert("동명이인이 있어요. 닉네임도 입력해 주세요.");
          return;
        }
        if (data?.error === "NO_PASSWORD_SET") {
          setSetPwdNickname(loginNickname);
          setStep("setpwd");
          return;
        }
        alert(data?.error || "인증 실패");
        return;
      }

      // 성공
      setMe(data.me);
      setScores(data.scores || []);
      setNick(data.me.nickname || "");
      setDept(data.me.dept || "");
      setHandi(data.me.handicap ?? "");
      setPtype((data.me.type || "EMPLOYEE").toUpperCase());
      setFamilyName(data.me.familyName || "");
      setNeedNickname(false);
      setStep("view");
    } catch {
      alert("네트워크 오류");
    } finally {
      setWorking(false);
    }
  }

  // 최초 비밀번호 설정
  async function setPasswordFirst(e) {
    e.preventDefault();
    if (!name.trim()) return alert("이름을 입력하세요.");
    if (!newPwd.trim()) return alert("새 비밀번호를 입력하세요.");
    if (newPwd !== newPwd2) return alert("비밀번호 확인이 일치하지 않습니다.");
    setWorking(true);
    try {
      const r = await fetch("/api/champ/participants/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password: newPwd,
          nickname: setPwdNickname.trim() || undefined,
        }),
      });
      const data = await r.json();

      if (!r.ok) {
        if (data?.error === "AMBIGUOUS_NAME_NEED_NICKNAME") {
          alert("동명이인이 있어요. 닉네임도 입력해 주세요.");
          return;
        }
        if (data?.error === "ALREADY_SET") {
          alert("이미 비밀번호가 설정되어 있어요. 로그인 해주세요.");
          setStep("login");
          return;
        }
        if (data?.error === "PARTICIPANT_NOT_FOUND") {
          alert("해당 이름의 참가자를 찾을 수 없어요. 먼저 참가 등록을 해주세요.");
          return;
        }
        alert(data?.error || "설정 실패");
        return;
      }

      // 설정 성공 → 자동 로그인 시도
      setPassword(newPwd);
      setLoginNickname(setPwdNickname);
      setNewPwd("");
      setNewPwd2("");

      const r2 = await fetch("/api/champ/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password: newPwd,
          nickname: setPwdNickname.trim() || undefined,
        }),
      });
      const d2 = await r2.json();
      if (!r2.ok) {
        alert("비밀번호가 설정되었습니다. 이제 로그인해 주세요.");
        setStep("login");
        return;
      }
      setMe(d2.me);
      setScores(d2.scores || []);
      setNick(d2.me.nickname || "");
      setDept(d2.me.dept || "");
      setHandi(d2.me.handicap ?? "");
      setPtype((d2.me.type || "EMPLOYEE").toUpperCase());
      setFamilyName(d2.me.familyName || "");
      setStep("view");
    } catch {
      alert("네트워크 오류");
    } finally {
      setWorking(false);
    }
  }

  // 기본정보 저장(닉/소속/핸디/구분/가족명, 비번변경)
  async function save() {
    if (ptype === "FAMILY" && !String(familyName).trim()) {
      alert("가족을 선택한 경우 가족명을 반드시 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/champ/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          password,                     // 현재 로그인 비번
          matchNickname: me?.nickname,  // 동명이인 매칭용(현재 닉)
          dept,
          nickname: nick,               // 바꿀 새 닉
          handicap: String(handi),      // 서버에서 숫자 변환
          newPassword: newPwForChange,  // 있으면 변경
          type: ptype,                  // ✅ 참가자 구분
          familyName: familyName || null, // ✅ 가족명
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data?.error === "AMBIGUOUS_NAME_NEED_NICKNAME") {
          alert("동명이인이 있어 닉네임 정보가 필요해요. 관리자에게 문의하세요.");
          return;
        }
        if (data?.error === "PASSWORD_INVALID") {
          alert("비밀번호가 올바르지 않습니다.");
          return;
        }
        alert(data?.error || "수정 실패");
        return;
      }
      alert("저장되었습니다.");
      setMe(data.me);
      setPtype((data.me.type || "EMPLOYEE").toUpperCase());
      setFamilyName(data.me.familyName || "");
      setNewPwForChange("");
    } finally {
      setSaving(false);
    }
  }

  /* ----------------- 화면 ----------------- */

  // 1) 로그인 화면
  if (step === "login") {
    return (
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-3xl font-extrabold text-emerald-800 mb-6">내 정보</h1>
        <form onSubmit={login} className="space-y-4 rounded-2xl border bg-white p-6">
          <div>
            <label className="block font-semibold mb-1">이름</label>
            <input
              className="w-full border rounded-lg p-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={working}
            />
          </div>

          {needNickname && (
            <>
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-900 p-3 text-sm">
                동명이인이 확인되었어요. 본인의 <b>골프존 닉네임</b>을 입력해 주세요.
              </div>
              <div>
                <label className="block font-semibold mb-1">닉네임</label>
                <input
                  id="login-nickname"
                  className="w-full border rounded-lg p-3 border-rose-300"
                  placeholder="예) 지원신이삭"
                  value={loginNickname}
                  onChange={(e) => setLoginNickname(e.target.value)}
                  disabled={working}
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold mb-1">비밀번호</label>
            <input
              type="password"
              className="w-full border rounded-lg p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={working}
            />
          </div>

          <button
            className="w-full rounded-xl bg-emerald-700 text-white p-3 font-semibold disabled:opacity-60"
            disabled={working}
          >
            {working ? "확인 중…" : "확인"}
          </button>

          <p className="text-xs text-gray-500">
            처음이신가요? 비밀번호가 없다면 다음 화면에서 바로 설정할 수 있어요.
          </p>

          <div className="text-right">
            <Link href="/champ" className="text-sm text-gray-500 hover:underline">
              ← 챔피언십 홈
            </Link>
          </div>
        </form>
      </main>
    );
  }

  // 2) 최초 비밀번호 설정 화면
  if (step === "setpwd") {
    return (
      <main className="max-w-md mx-auto p-6">
        <h1 className="text-3xl font-extrabold text-emerald-800 mb-6">비밀번호 설정</h1>
        <form onSubmit={setPasswordFirst} className="space-y-4 rounded-2xl border bg-white p-6">
          <p className="text-sm text-gray-600">
            이 계정은 아직 비밀번호가 없습니다. 새 비밀번호를 설정해주세요.
          </p>
          <div>
            <label className="block font-semibold mb-1">이름</label>
            <input
              className="w-full border rounded-lg p-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={working}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              닉네임 <span className="text-xs text-gray-400">(동명이인이면 필수)</span>
            </label>
            <input
              className="w-full border rounded-lg p-3"
              placeholder="예) 지원신이삭"
              value={setPwdNickname}
              onChange={(e) => setSetPwdNickname(e.target.value)}
              disabled={working}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">새 비밀번호</label>
            <input
              type="password"
              className="w-full border rounded-lg p-3"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              disabled={working}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              className="w-full border rounded-lg p-3"
              value={newPwd2}
              onChange={(e) => setNewPwd2(e.target.value)}
              disabled={working}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-xl bg-emerald-700 text-white p-3 font-semibold disabled:opacity-60"
              disabled={working}
            >
              {working ? "설정 중…" : "비밀번호 설정"}
            </button>
            <button
              type="button"
              className="rounded-xl border px-4"
              onClick={() => setStep("login")}
              disabled={working}
            >
              뒤로
            </button>
          </div>
        </form>
      </main>
    );
  }

  // 3) 내 정보/기록 화면
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-emerald-800">내 정보</h1>
        <Link href="/champ" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          ← 챔피언십 홈
        </Link>
      </header>

      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold">이름</label>
            <div className="rounded-lg border p-3 bg-gray-50">{me?.name}</div>
          </div>
          <div>
            <label className="block text-sm font-semibold">닉네임</label>
            <input
              className="w-full border rounded-lg p-3"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
            />
          </div>

          {/* ✅ 참가자 구분 */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold mb-1">참가자 구분</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPtype("EMPLOYEE")}
                className={`px-3 py-2 rounded-lg border ${ptype === "EMPLOYEE" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white"}`}
              >
                직원
              </button>
              <button
                type="button"
                onClick={() => setPtype("FAMILY")}
                className={`px-3 py-2 rounded-lg border ${ptype === "FAMILY" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white"}`}
              >
                가족
              </button>

              <input
                className="flex-1 border rounded-lg p-3"
                placeholder="가족명"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                disabled={ptype !== "FAMILY"}
              />
            </div>
            {ptype === "FAMILY" && (
              <p className="text-xs text-rose-600 mt-1">가족을 선택한 경우 가족명을 반드시 입력하세요.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold">소속(가족은 직원의 소속 기재)</label>
            <input
              className="w-full border rounded-lg p-3"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">핸디</label>
            <input
              className="w-full border rounded-lg p-3"
              value={handi}
              onChange={(e) => setHandi(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold">새 비밀번호 (변경 시)</label>
            <input
              type="password"
              className="w-full border rounded-lg p-3"
              value={newPwForChange}
              onChange={(e) => setNewPwForChange(e.target.value)}
              placeholder="비워두면 변경하지 않습니다"
            />
          </div>
        </div>

        <div className="text-right">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-emerald-700 text-white px-4 py-2 font-semibold disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-bold mb-3">대회 기록</h2>
        {scores.length === 0 ? (
          <p className="text-gray-500">등록된 기록이 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {scores.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-semibold">
                    {s.event?.season?.name} · {s.event?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {s.event?.playedAt
                      ? new Date(s.event.playedAt).toLocaleDateString("ko-KR")
                      : "일자 미정"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{s.strokes ?? "-" }타</div>
                  <div className="text-sm text-gray-500">{s.points ?? 0} pts</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
