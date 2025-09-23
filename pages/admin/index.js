// pages/admin/index.js
import { useEffect, useState } from "react";
import Uploader from "../../components/Uploader";

const ADMIN_PASSWORD = "dbsonsa"; // 요청: 고정 비밀번호

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    // 간단한 클라 측 토큰(새로고침 유지용)
    if (typeof window !== "undefined" && localStorage.getItem("admin_ok") === "1") {
      setAuthed(true);
      fetchCurrent();
    }
  }, []);

  const login = (e) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      setAuthed(true);
      if (typeof window !== "undefined") localStorage.setItem("admin_ok", "1");
      fetchCurrent();
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  async function fetchCurrent() {
    try {
      const r = await fetch("/api/admin/hero");
      const j = await r.json();
      setCurrentUrl(j?.value || "");
    } catch {}
  }

  async function onSave() {
    if (!imgUrl) return alert("이미지를 먼저 업로드 해주세요.");
    setSaving(true);
    try {
      const r = await fetch("/api/admin/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASSWORD, imageUrl: imgUrl }),
      });
      const j = await r.json();
      if (!r.ok) return alert(j?.error || "저장 실패");
      alert("배경 이미지가 저장되었습니다.");
      setCurrentUrl(imgUrl);
      setImgUrl("");
    } finally {
      setSaving(false);
    }
  }

  if (!authed) {
    return (
      <main className="max-w-sm mx-auto p-6">
        <h1 className="text-2xl font-bold">관리자 로그인</h1>
        <form className="mt-6 space-y-3" onSubmit={login}>
          <input
            type="password"
            placeholder="비밀번호"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full border rounded-xl p-3"
          />
          <button className="w-full rounded-xl bg-emerald-700 py-3 text-white font-semibold">
            로그인
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold">관리 도구</h1>

      <section className="mt-6 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">① 랜딩 배경 바꾸기 (덮어쓰기)</h2>

        {currentUrl ? (
          <div className="mt-3">
            <div className="text-sm text-gray-600">현재 배경 미리보기</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl} alt="current hero" className="mt-2 rounded-xl border" />
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">현재 등록된 배경이 없습니다.</p>
        )}

        <div className="mt-4">
          <Uploader
            onUploaded={(url) => setImgUrl(url || "")}
            defaultUrl={imgUrl}
            label="이미지 업로드"
          />
          <input type="hidden" value={imgUrl || ""} />
        </div>

        <div className="mt-4">
          <button
            onClick={onSave}
            disabled={saving || !imgUrl}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-white font-semibold disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </section>
    </main>
  );
}
