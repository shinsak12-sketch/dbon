// components/Uploader.js
import { useEffect, useRef, useState } from "react";

export default function Uploader({
  onUploaded,
  label = "이미지 선택",
  defaultUrls = [],
  max = 10,                // 업로드 최대 개수 (옵션)
  accept = "image/*",      // 입력 accept (옵션)
}) {
  // defaultUrls가 string이든 배열이든 깔끔하게 배열로 정규화
  const normalize = (v) =>
    (Array.isArray(v) ? v : v ? [v] : []).map(String).filter(Boolean);

  const [previews, setPreviews] = useState(normalize(defaultUrls));
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // 🔄 부모에서 defaultUrls가 바뀌면 미리보기 동기화
  useEffect(() => {
    setPreviews(normalize(defaultUrls));
  }, [defaultUrls]);

  // 공통: state 갱신 + 부모 콜백
  const apply = (next) => {
    const uniq = Array.from(new Set(next)).slice(0, max);
    setPreviews(uniq);
    onUploaded?.(uniq);
  };

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
        { method: "POST", body: fd }
      );
      const data = await res.json();
      console.log("[Cloudinary upload response]", data);

      if (!res.ok || data.error) {
        const msg =
          data?.error?.message || data?.message || `HTTP ${res.status} 업로드 실패`;
        alert(`업로드 오류: ${msg}`);
        return;
      }

      if (data.secure_url) {
        apply([...previews, data.secure_url]);
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
    if (!files.length) return;

    // 남은 슬롯만큼만 업로드
    const remain = Math.max(0, max - previews.length);
    const pick = remain ? files.slice(0, remain) : [];

    pick.forEach((file) => upload(file));

    // 같은 파일을 다시 선택해도 onChange가 트리거되도록 초기화
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(url) {
    apply(previews.filter((u) => u !== url));
  }

  return (
    <div className="space-y-2">
      {/* 미리보기 여러 개 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {previews.map((url, i) => (
            <div key={url + i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
        disabled={loading || previews.length >= max}
        className={`px-4 py-2 rounded-lg text-white font-semibold ${
          loading ? "bg-gray-400" : "bg-emerald-700 hover:bg-emerald-800"
        }`}
      >
        {loading
          ? "업로드 중..."
          : previews.length >= max
          ? `최대 ${max}장 업로드됨`
          : label}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}
