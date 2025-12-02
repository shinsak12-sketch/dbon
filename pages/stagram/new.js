// pages/stagram/new.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function NewStagramPost() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [dept, setDept] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // 파일 선택
  const handleFilesChange = (e) => {
    const list = Array.from(e.target.files || []).slice(0, 5); // 최대 5장
    setFiles(list);
    setPreviews(
      list.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }))
    );
  };

  // 메모리 누수 방지
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("content", content.trim());
      fd.append("tags", tags.trim());
      if (author.trim()) fd.append("author", author.trim());
      if (dept.trim()) fd.append("dept", dept.trim());

      files.forEach((file) => {
        fd.append("images", file); // 서버에서 images 필드로 받음
      });

      const res = await fetch("/api/stagram/posts", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "등록 실패");
      }

      // 성공 시 피드로 이동
      router.push("/stagram");
    } catch (err) {
      console.error(err);
      alert("등록 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* 상단 제목 + 뒤로가기 */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-emerald-800 hover:underline"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg sm:text-xl font-extrabold text-emerald-900">
            새 디비온스타그램
          </h1>
          <div className="w-12" /> {/* 가운데 정렬용 */}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border bg-white p-5 sm:p-6 shadow-sm space-y-4"
        >
          {/* 1. 기본 정보 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600">
                작성자 이름
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="예) 신이삭"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600">
                부서
              </label>
              <input
                type="text"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="예) 인사팀"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* 2. 제목 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="어떤 소식인가요?"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* 3. 내용 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              내용 <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="자유롭게 내용을 작성해 주세요."
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* 4. 태그 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              태그 (쉼표 또는 띄어쓰기로 구분)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#워크샵 #회식 #공지"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* 5. 이미지 첨부 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              사진 첨부 (최대 5장)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesChange}
              className="mt-1 block w-full text-sm"
            />

            {/* 미리보기 */}
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {previews.map((p) => (
                  <div
                    key={p.url}
                    className="relative overflow-hidden rounded-xl border bg-gray-50"
                  >
                    <img
                      src={p.url}
                      alt={p.name}
                      className="h-24 w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="pt-2 flex justify-end gap-2">
            <Link
              href="/stagram"
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
            >
              {submitting ? "등록 중…" : "등록하기"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
