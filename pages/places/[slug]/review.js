// pages/places/[slug]/review.js
import prisma from "../../../lib/prisma";
import { useState, useRef } from "react";

/** 서버사이드: 장소 정보 + (edit 모드면) 기존 리뷰 불러오기 */
export async function getServerSideProps({ params, query }) {
  const place = await prisma.place.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      name: true,
      region: { select: { slug: true, name: true } },
    },
  });
  if (!place) return { notFound: true };

  let editReview = null;
  const editId = Number(query.edit);
  if (editId) {
    const r = await prisma.review.findUnique({
      where: { id: editId },
      select: {
        id: true,
        placeId: true,
        rating: true,
        content: true,
        author: true,
        imageUrl: true,
      },
    });
    // 다른 가게 리뷰 접근 방지
    if (r && r.placeId === place.id) {
      editReview = {
        id: r.id,
        rating: r.rating,
        content: r.content || "",
        author: r.author || "",
        imageUrl: r.imageUrl || "",
      };
    }
  }

  return {
    props: {
      slug: place.slug,
      regionSlug: place.region.slug,
      placeName: place.name,
      regionName: place.region.name,
      editReview, // 없으면 null
    },
  };
}

/** ★ 클릭형 별점 */
function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n}점`}
            onClick={() => onChange(n)}
            className={active ? "text-yellow-500" : "text-gray-300"}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

/** 파일을 DataURL(base64)로 변환 */
async function fileToDataURL(file, maxW = 1600, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > maxW) {
    const scale = maxW / width;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function ReviewForm({ slug, regionSlug, placeName, editReview }) {
  const isEdit = !!editReview;

  // ✅ 기존 리뷰값으로 초기 세팅 (없으면 기본값)
  const [rating, setRating] = useState(editReview?.rating ?? 5);
  const [content, setContent] = useState(editReview?.content ?? "");
  const [author, setAuthor] = useState(editReview?.author ?? "");
  const [pin, setPin] = useState("");
  const [imageUrl, setImageUrl] = useState(editReview?.imageUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState(editReview?.imageUrl ?? "");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataURL(file);
      setImageUrl(dataUrl);
      setPreviewUrl(dataUrl);
    } catch {
      alert("이미지 처리 중 문제가 발생했습니다.");
    }
  }

  function clearImage() {
    setImageUrl("");
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return alert("리뷰 내용을 입력해주세요.");
    if (!author.trim()) return alert("닉네임을 입력해주세요.");
    if (!pin.trim()) return alert("비밀번호를 입력해주세요.");

    setLoading(true);
    try {
      let res, data;

      if (isEdit) {
        // ✅ 수정
        res = await fetch(`/api/reviews/${editReview.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            content,
            author,
            imageUrl, // 유지/변경/제거(빈 문자열) 모두 반영
            pin,      // 검증용
          }),
        });
      } else {
        // 생성
        res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            rating,
            content,
            author,
            imageUrl,
            pin,
          }),
        });
      }

      data = await res.json();
      if (!res.ok) {
        alert(data?.error || (isEdit ? "수정 실패" : "등록 실패"));
        return;
      }
      // 완료 후 상세로
      window.location.assign(`/places/${regionSlug}/${slug}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">
        {isEdit ? `리뷰 수정 — ${placeName}` : `리뷰 작성 — ${placeName}`}
      </h1>

      <form className="mt-6 space-y-6" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">별점</label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="grid gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">닉네임</label>
            <input
              className="w-full border rounded-lg p-3"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </div>

          {/* 이미지 첨부 (선택) */}
          <div>
            <label className="block text-sm font-medium mb-1">이미지 첨부 (선택)</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="block w-full text-sm"
              />
              {previewUrl ? (
                <button
                  type="button"
                  onClick={clearImage}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  제거
                </button>
              ) : null}
            </div>

            {previewUrl ? (
              <div className="mt-3">
                {/* 미리보기 */}
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full rounded-xl border"
                  onError={clearImage}
                />
              </div>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              비밀번호(수정/삭제용)
            </label>
            <input
              className="w-full border rounded-lg p-3"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">리뷰 내용</label>
            <textarea
              className="w-full border rounded-lg p-3"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-emerald-700 hover:bg-emerald-800"
          }`}
        >
          {loading ? (isEdit ? "수정 중..." : "등록 중...") : (isEdit ? "수정" : "등록")}
        </button>
      </form>
    </main>
  );
}
