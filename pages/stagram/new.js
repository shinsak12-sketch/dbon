// pages/stagram/new.js
import { useRouter } from "next/router";
import { useState } from "react";

export default function StagramNew() {
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [authorDept, setAuthorDept] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]); // {file, preview}[]
  const [submitting, setSubmitting] = useState(false);

  const onFileChange = (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const next = list.slice(0, 5); // 최대 5장 제한
    const mapped = next.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFiles(mapped);
  };

  const removeImage = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!content.trim() && files.length === 0) {
      alert("내용 또는 사진을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      // 1) 파일들을 base64로 변환
      let imageUrls = [];
      if (files.length > 0) {
        const asBase64 = await Promise.all(
          files.map(
            (f) =>
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(f.file);
              })
          )
        );

        // 2) 업로드 API 호출 (현재는 그대로 에코해주는 형태)
        const upRes = await fetch("/api/stagram/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: asBase64 }),
        });
        const upData = await upRes.json();
        if (!upRes.ok || !upData.ok) {
          throw new Error(upData?.error || "이미지 업로드 실패");
        }
        imageUrls = upData.urls || [];
      }

      // 3) 게시글 생성 API 호출
      const res = await fetch("/api/stagram/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName.trim() || undefined,
          authorDept: authorDept.trim() || undefined,
          content,
          imageUrls,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "게시글 등록 실패");
      }

      alert("게시글이 등록되었습니다.");
      router.push("/stagram");
    } catch (err) {
      console.error(err);
      alert(err.message || "등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="mx-auto max-w-xl px-4 py-4 sm:py-8">
        {/* 상단 */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-emerald-900">
            새 디비온스타그램
          </h1>
          <div className="w-10" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white p-4 sm:p-5 space-y-4 shadow-sm"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="작성자 이름 (선택)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
            <input
              type="text"
              className="rounded-md border px-3 py-2 text-sm"
              placeholder="소속/부서 (선택)"
              value={authorDept}
              onChange={(e) => setAuthorDept(e.target.value)}
            />
          </div>

          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm min-h-[120px]"
            placeholder="어떤 일이 있었나요? #해시태그 를 함께 써보세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">
              사진 첨부 (최대 5장)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              className="block w-full text-sm"
            />

            {files.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden border"
                  >
                    <img
                      src={f.preview}
                      alt={`preview-${idx}`}
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "등록 중…" : "등록하기"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
