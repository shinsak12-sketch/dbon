// pages/places/[slug]/review.js
import prisma from "../../../lib/prisma";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

export async function getServerSideProps({ params, query }) {
  const place = await prisma.place.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true,
      name: true,
      region: { select: { slug: true, name: true } },
    },
  });
  if (!place) return { notFound: true };

  // 수정 모드일 때 리뷰도 가져오기
  let review = null;
  if (query.edit) {
    const id = parseInt(query.edit, 10);
    if (!isNaN(id)) {
      review = await prisma.review.findUnique({
        where: { id },
        select: {
          id: true,
          rating: true,
          content: true,
          author: true,
          imageUrls: true,
        },
      });
    }
  }

  return {
    props: {
      slug: place.slug,
      regionSlug: place.region.slug,
      placeName: place.name,
      review: review || null,
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

export default function ReviewForm({ slug, regionSlug, placeName, review }) {
  const router = useRouter();
  const editMode = !!review;

  const [rating, setRating] = useState(review?.rating || 5);
  const [content, setContent] = useState(review?.content || "");
  const [author, setAuthor] = useState(review?.author || "");
  const [pin, setPin] = useState("");
  const [imageUrl, setImageUrl] = useState(review?.imageUrls?.[0] || "");
  const [previewUrl, setPreviewUrl] = useState(review?.imageUrls?.[0] || "");
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
      const payload = {
        slug,
        rating,
        content,
        author,
        imageUrl,
        pin,
      };

      let res;
      if (editMode) {
        res = await fetch(`/api/reviews/${review.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || (editMode ? "수정 실패" : "등록 실패"));
        return;
      }
      router.push(`/places/${regionSlug}/${slug}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">
        {editMode ? "리뷰 수정" : "리뷰 작성"} — {placeName}
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

          {/* 이미지 첨부 */}
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
          {loading ? (editMode ? "수정 중..." : "등록 중...") : editMode ? "수정" : "등록"}
        </button>
      </form>
    </main>
  );
          }
