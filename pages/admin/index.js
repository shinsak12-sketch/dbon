// pages/admin/index.js
import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lastUrl, setLastUrl] = useState("");

  const CORRECT = "dbsonsa";

  const onLogin = (e) => {
    e.preventDefault();
    if (password === CORRECT) setAuthed(true);
    else alert("비밀번호가 올바르지 않습니다.");
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type?.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onUpload = async () => {
    if (!file) return alert("이미지를 선택하세요.");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/background", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "업로드 실패");

      setLastUrl(data.secure_url || "");
      alert("배경 이미지가 변경되었습니다.");
      setFile(null);
      setPreview("");
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  if (!authed) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={onLogin} className="bg-white p-6 rounded-xl shadow-md space-y-4 w-80">
          <h1 className="text-lg font-bold">관리자 로그인</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full border rounded-lg p-3"
          />
          <button
            type="submit"
            className="w-full bg-emerald-700 text-white p-3 rounded-lg font-semibold hover:bg-emerald-800"
          >
            로그인
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <h1 className="text-2xl font-bold mb-6">관리자 메뉴</h1>

      <div className="grid gap-6">
        {/* 메뉴 1: 배경 바꾸기 (Cloudinary 덮어쓰기) */}
        <div className="border rounded-xl bg-white p-6 shadow">
          <h2 className="font-semibold mb-3">1. 배경 바꾸기</h2>

          <input type="file" accept="image/*" onChange={onFileChange} />
          {preview && (
            <div className="mt-3">
              <img src={preview} alt="preview" className="w-full max-w-xs rounded-lg border" />
            </div>
          )}

          <button
            onClick={onUpload}
            disabled={uploading || !file}
            className="mt-4 bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 disabled:opacity-60"
          >
            {uploading ? "업로드 중…" : "적용하기"}
          </button>

          {lastUrl && (
            <p className="mt-3 text-sm text-gray-500 break-all">
              최신 이미지: <a className="underline" href={lastUrl} target="_blank" rel="noreferrer">{lastUrl}</a>
            </p>
          )}

          <p className="mt-3 text-sm text-gray-500">
            업로드하면 Cloudinary의 <code>site/background</code> public_id로 <b>덮어쓰기</b>됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}
