// components/Uploader.js
import { useRef, useState } from "react";

export default function Uploader({
  label = "대표 이미지 선택",
  defaultUrl = "",
  maxSizeMB = 8,
  onUploaded, // (url: string) => void
}) {
  const [preview, setPreview] = useState(defaultUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const openPicker = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 간단한 용량/타입 검증
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`이미지 용량은 최대 ${maxSizeMB}MB까지 가능합니다.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있어요.");
      return;
    }
    setError("");
    upload(file);
  };

  async function upload(file) {
    setLoading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload-cloudinary", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "업로드 실패");
      }

      const data = await res.json();
      if (!data.secure_url) {
        throw new Error("업로드 응답에 URL이 없습니다.");
      }

      setPreview(data.secure_url);
      onUploaded?.(data.secure_url);
    } catch (err) {
      console.error(err);
      setError(err.message || "업로드 중 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* 미리보기 */}
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="w-full rounded-xl border object-cover"
        />
      )}

      {/* 업로드 버튼 */}
      <button
        type="button"
        onClick={openPicker}
        disabled={loading}
        className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition
          ${loading ? "bg-gray-400" : "bg-emerald-700 hover:bg-emerald-800"}`}
      >
        {loading ? "업로드 중..." : label}
      </button>

      {/* 파일 입력 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {/* 에러 메시지 */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* 안내 */}
      <p className="text-xs text-gray-500">
        {`이미지 파일(최대 ${maxSizeMB}MB)을 업로드합니다.`}
      </p>
    </div>
  );
}
