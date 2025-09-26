// components/Uploader.js
import { useRef, useState } from "react";

export default function Uploader({
  onUploaded,
  label = "이미지 선택",
  defaultUrls = [],
}) {
  const [previews, setPreviews] = useState(defaultUrls);
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
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
        {
          method: "POST",
          body: fd,
        }
      );

      const data = await res.json();
      console.log("[Cloudinary upload response]", data);

      if (!res.ok || data.error) {
        const msg =
          data?.error?.message ||
          data?.message ||
          `HTTP ${res.status} 업로드 실패`;
        alert(`업로드 오류: ${msg}`);
        return;
      }

      if (data.secure_url) {
        const newList = [...previews, data.secure_url];
        setPreviews(newList);
        onUploaded?.(newList);
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
    const files = Array.from(e.target.files || []);
    files.forEach((file) => upload(file));
  }

  function removeImage(url) {
    const newList = previews.filter((u) => u !== url);
    setPreviews(newList);
    onUploaded?.(newList);
  }

  return (
    <div className="space-y-2">
      {/* 미리보기 여러 개 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {previews.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`preview-${i}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
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
        multiple
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}
