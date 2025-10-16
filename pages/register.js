// pages/register.js
import { useState } from "react";
import Link from "next/link";

export default function ChampRegister() {
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [nickname, setNickname] = useState("");
  const [handicap, setHandicap] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState("STAFF");         // STAFF | FAMILY
  const [familyName, setFamilyName] = useState("");  // 가족 선택 시 필수
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();

    // ---- 기본 검증 ----
    if (!name.trim()) return alert("이름을 입력해주세요.");
    if (!nickname.trim()) return alert("골프존 닉네임을 입력해주세요.");
    if (!password.trim() || password.trim().length < 4)
      return alert("비밀번호를 4자 이상 입력해주세요.");
    if (type === "FAMILY" && !familyName.trim())
      return alert("가족을 선택한 경우 가족명을 입력해주세요.");

    // 핸디 숫자만 허용(빈값은 전송 생략)
    let handiPayload = undefined;
    if (String(handicap).trim() !== "") {
      const n = Number(handicap);
      if (Number.isNaN(n)) return alert("핸디는 숫자로 입력해주세요.");
      handiPayload = n;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/champ/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dept: dept.trim() || undefined,
          nickname: nickname.trim(),
          handicap: handiPayload,             // 숫자 또는 undefined
          password: password.trim(),
          type,                               // 'STAFF' | 'FAMILY'
          familyName: type === "FAMILY" ? familyName.trim() : null,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data?.error === "NICKNAME_EXISTS") {
          alert("이미 등록된 닉네임입니다. 관리자에게 문의해주세요.");
        } else if (data?.error === "NAME_AND_NICK_REQUIRED") {
          alert("이름과 닉네임은 필수입니다.");
        } else if (data?.error === "MISSING_FAMILY_NAME") {
          alert("가족명을 입력해주세요.");
        } else {
          alert(data?.error || "등록 실패");
        }
        return;
      }
      alert("등록되었습니다! 상단 ‘내 정보’에서 수정할 수 있어요.");
      window.location.assign("/champ");
    } catch (e) {
      console.error(e);
      alert("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  const familyOn = type === "FAMILY";

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-emerald-800 mb-6">디비온 참가 등록</h1>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-6">
        {/* 이름 */}
        <div>
          <label className="block font-semibold mb-1">이름 *</label>
          <input
            className="w-full border rounded-lg p-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 참가자 구분 + 가족명 */}
        <div>
          <label className="block font-semibold mb-1">참가자 구분 *</label>
          <div className="flex gap-2">
            <select
              className="border rounded-lg p-3"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="STAFF">직원</option>
              <option value="FAMILY">가족</option>
            </select>
            <input
              className={`flex-1 border rounded-lg p-3 ${familyOn ? "" : "opacity-50"}`}
              placeholder="가족명"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              disabled={!familyOn}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            가족을 선택한 경우 가족명을 반드시 입력하세요.
          </p>
        </div>

        {/* 소속 */}
        <div>
          <label className="block font-semibold mb-1">
            소속(가족은 직원의 소속 기재)
          </label>
          <input
            className="w-full border rounded-lg p-3"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            placeholder="예) 지원파트"
          />
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block font-semibold mb-1">골프존 닉네임 *</label>
          <input
            className="w-full border rounded-lg p-3"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="예) 지원신이삭"
          />
        </div>

        {/* 핸디 */}
        <div>
          <label className="block font-semibold mb-1">핸디(선택)</label>
          <input
            className="w-full border rounded-lg p-3"
            value={handicap}
            onChange={(e) => setHandicap(e.target.value)}
            inputMode="decimal"
            placeholder="숫자만 입력"
          />
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block font-semibold mb-1">비밀번호 *</label>
          <input
            type="password"
            className="w-full border rounded-lg p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="‘내 정보’에서 수정/조회 시 사용"
            minLength={4}
          />
          <p className="mt-1 text-xs text-gray-500">
            이름 + 비밀번호로 본인 확인합니다. (최소 4자)
          </p>
        </div>

        {/* 액션 */}
        <button
          disabled={loading}
          className="w-full rounded-xl bg-emerald-700 text-white p-3 font-semibold disabled:opacity-60"
        >
          {loading ? "등록 중…" : "등록"}
        </button>

        {/* 우측 하단 홈 링크 (활성) */}
        <div className="text-right">
          <Link href="/champ" className="text-sm text-emerald-700 hover:underline">
            ← 챔피언십 홈
          </Link>
        </div>
      </form>
    </main>
  );
}
