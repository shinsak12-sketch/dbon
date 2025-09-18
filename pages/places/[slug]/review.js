// pages/places/[slug]/review.js
import { useState } from "react";

/** ★ 클릭형 별점 컴포넌트 */
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

export default function ReviewForm({ slug }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      alert("별점은 1~5 사이로 선택해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, rating, content })
      });
      const data = await res.json();
      if (res.ok) {
        // 작성 후 상세 페이지로
        window.location.href = `/places/${slug}`;
      } else {
        alert(data.error || "등록 실패");
      }
    } catch (err) {
      console.error(err);
      alert("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">리뷰 작성</h1>
      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">별점</label>
          <StarRating value={rating} onChange={setRating} />
          <p className="text-xs text-gray-500 mt-1">현재 선택: {rating} / 5</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">리뷰 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded-lg p-3"
            rows={5}
            placeholder="맛/서비스/분위기 등 자유롭게 적어주세요"
            required
          />
        </div>

        <button
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold ${
            loading ? "bg-gray-400" : "bg-emerald-700 hover:bg-emerald-800"
          }`}
        >
          {loading ? "등록 중..." : "등록"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <a href={`/places/${slug}`} className="text-sm text-gray-500 underline">
          ← 상세 페이지로 돌아가기
        </a>
      </div>
    </main>
  );
}

export async function getServerSideProps({ params }) {
  return { props: { slug: params.slug } };
    }
