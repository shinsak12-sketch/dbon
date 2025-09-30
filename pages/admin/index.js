import { useEffect, useState } from "react";
import Uploader from "../../components/Uploader";
import Link from "next/link";

export default function Admin() {
  const [pwd, setPwd] = useState("");
  const [authed, setAuthed] = useState(false);
  const [bgUrl, setBgUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // 현재 저장된 배경 URL 로드
  useEffect(() => {
    fetch("/api/admin/background")
      .then((r) => r.json())
      .then((d) => setBgUrl(d?.url || ""))
      .catch(() => {});
  }, []);

  function tryLogin(e) {
    e.preventDefault();
    if (pwd === "dbsonsa") setAuthed(true);
    else alert("비밀번호가 틀렸습니다.");
  }

  async function onUploaded(url) {
    setSaving(true);
    try {
      const r = await fetch("/api/admin/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "dbsonsa", url }),
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data?.error || "SERVER_ERROR");
        return;
      }
      setBgUrl(url);
      alert("배경 이미지가 저장되었습니다.");
    } catch (e) {
      alert("SERVER_ERROR");
    } finally {
      setSaving(false);
    }
  }

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

  return (
    <main className="max-w-xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-extrabold mb-6">관리 도구</h1>

      {/* 기존 배경 이미지 관리 */}
      <section className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-xl font-bold">① 랜딩 배경 바꾸기 (덮어쓰기)</h2>
        {bgUrl ? (
          <div className="rounded-xl overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bgUrl} alt="현재 배경" className="w-full" />
          </div>
        ) : (
          <p className="text-gray-600">현재 등록된 배경이 없습니다.</p>
        )}
        <Uploader
          label={saving ? "업로드 중…" : "이미지 업로드"}
          onUploaded={onUploaded}
          disabled={saving}
        />
      </section>

      {/* 새로 추가: 챔피언십 관리 */}
      <section className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-xl font-bold">② 디비온 챔피언십 관리</h2>
        <div className="grid gap-3">
          <Link
            href="/champ/admin/events/new"
            className="block rounded-xl border p-3 hover:bg-gray-50"
          >
            대회 개설
          </Link>
          <Link
            href="/champ/admin/uploads"
            className="block rounded-xl border p-3 hover:bg-gray-50"
          >
            결과 업로드 (엑셀/JSON)
          </Link>
          <Link
            href="/champ/participate"
            className="block rounded-xl border p-3 hover:bg-gray-50"
          >
            참가자 등록 현황
          </Link>
        </div>
      </section>
    </main>
  );
}
