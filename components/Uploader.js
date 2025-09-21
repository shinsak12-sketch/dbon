// components/Uploader.js
import { useRef, useState } from "react";

export default function Uploader({
  onUploaded,
  label = "이미지 선택",
  defaultUrl = "",
}) {
  const [preview, setPreview] = useState(defaultUrl);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  async function upload(file) {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

    if (!cloud || !preset) {
      alert("Cloudinary 환경변수가 없습니다. (cloudName/preset 확인)");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);

    setLoading(true);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
        method: "POST",
        body: fd,
      });

      // 응답 전문 확인용
      const data = await res.json();
      console.log("[Cloudinary upload response]", data);

      if (!res.ok || data.error) {
        const msg =
          data?.error?.message ||
          data?.message ||
          `HTTP ${res.status} 업로드 실패`;
        alert(`업로드 오류: ${msg}`);
        return;
        // 예시 에러 메시지:
        // - preset not found
        // - unsigned upload not allowed
        // - Invalid unsigned upload preset
        // - File size too large
      }

      if (data.secure_url) {
        setPreview(data.secure_url);
        onUploaded?.(data.secure_url);
      } else {
        alert("업로드는 성공했지만 URL을 받지 못했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert(`업로드 오류: ${e?.message || e}`);
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
      {preview && (
        <img src={preview} alt="preview" className="w-full rounded-lg border" />
      )}
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
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}
