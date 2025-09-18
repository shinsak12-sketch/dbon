import { useState } from "react";

export default function ReviewForm({ slug }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, rating, content })
    });
    if (res.ok) {
      window.location.href = `/places/${slug}`;
    } else {
      const data = await res.json();
      alert(data.error || "등록 실패");
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">리뷰 작성</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium">별점 (1~5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mt-1 w-full border rounded-lg p-3"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">리뷰 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full border rounded-lg p-3"
            rows={4}
            required
          />
        </div>
        <button className="w-full py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800">
          등록
        </button>
      </form>
    </main>
  );
}

export async function getServerSideProps({ params }) {
  return { props: { slug: params.slug } };
}
