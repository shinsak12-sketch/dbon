import { useRef, useState } from "react";

export default function Uploader({ onUploaded, label = "이미지 선택", defaultUrl = "" }) {
  const [preview, setPreview] = useState(defaultUrl);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  async function upload(file) {
    const fd = new FormData();
    fd.append("file", file);

    setLoading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        setPreview(data.url);
        onUploaded?.(data.url);
      } else {
        alert("업로드 실패");
      }
    } catch (e) {
      console.error(e);
      alert("업로드 오류");
    } finally {
      setLoading(false);
    }
  }

  function onChange(e) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="space-y-2">
      {preview && <img src={preview} alt="preview" className="w-full rounded-lg border" />}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-white font-semibold ${
          loading ? "bg-gray-400" : "bg-emerald-700 hover:bg-emerald-800"
        }`}
      >
        {loading ? "업로드 중..." : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
    </div>
  );
}
