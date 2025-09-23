// pages/admin/index.js
import { useState } from "react";

const ADMIN_PASS = "dbsonsa"; // 요구한 비밀번호(간단 버전)

export default function Admin() {
  const [ok, setOk] = useState(false);
  const [pass, setPass] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleUpload() {
    if (!file) return alert("이미지를 선택하세요.");
    setBusy(true);
    setMsg("");

    try {
      // 1) 서버에 서명 요청
      const sigRes = await fetch("/api/admin/cloudinary-sign", { method: "POST" });
      const sig = await sigRes.json();
      if (!sigRes.ok) throw new Error(sig?.error || "서명 실패");

      // 2) Cloudinary로 직접 업로드(덮어쓰기)
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", sig.timestamp);
      form.append("public_id", sig.public_id);
      form.append("overwrite", "true");
      form.append("invalidate", "true");
      form.append("signature", sig.signature);

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: form }
      );
      const up = await upRes.json();
      if (!upRes.ok) throw new Error(up?.error?.message || "업로드 실패");

      setMsg("배경 이미지가 업데이트 되었어요! 새로고침하면 반영됩니다.");
    } catch (e) {
      setMsg(e.message || "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (!ok) {
    return (
      <main className="mx-auto max-w-sm p-8">
        <h1 className="text-2xl font-extrabold mb-4">Admin Login</h1>
        <input
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          type="password"
          className="w-full border rounded-lg p-3"
          placeholder="비밀번호"
        />
        <button
          className="mt-3 w-full rounded-lg bg-emerald-700 text-white py-3 font-semibold"
          onClick={() => setOk(pass === ADMIN_PASS)}
        >
          들어가기
        </button>
        {pass && pass !== ADMIN_PASS && (
          <p className="mt-2 text-sm text-red-600">비밀번호가 올바르지 않습니다.</p>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-extrabold mb-4">배경 바꾸기</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full"
      />

      <button
        onClick={handleUpload}
        disabled={busy || !file}
        className={`mt-4 w-full rounded-lg text-white py-3 font-semibold ${
          busy ? "bg-gray-400" : "bg-emerald-700 hover:bg-emerald-800"
        }`}
      >
        {busy ? "업로드 중..." : "업로드(덮어쓰기)"}
      </button>

      {msg && <p className="mt-3 text-sm">{msg}</p>}

      <div className="mt-6">
        <p className="text-sm text-gray-500">현재 사용 중인 URL(고정):</p>
        <code className="text-xs break-all">
          {`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD"}/image/upload/landing/hero`}
        </code>
      </div>
    </main>
  );
}
