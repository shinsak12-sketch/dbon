import { useState } from "react";

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

export default function ReviewForm({ slug }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return alert("리뷰 내용을 입력해주세요.");
    if (!author.trim()) return alert("닉네임을 입력해주세요.");
    if (!pin.trim()) return alert("비밀번호를 입력해주세요.");
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, rating, content, author, imageUrl, pin })
      });
      const data = await res.json();
      if (res.ok) window.location.href = `/places/${slug}`;
      else alert(data.error || "등록 실패");
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
          <label className="block text-sm font-medium mb-1">닉네임</label>
          <input className="w-full border rounded-lg p-3" value={author} onChange={e=>setAuthor(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">이미지 URL (선택)</label>
          <input className="w-full border rounded-lg p-3" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">비밀번호(수정/삭제용)</label>
          <input className="w-full border rounded-lg p-3" type="password" value={pin} onChange={e=>setPin(e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">리뷰 내용</label>
          <textarea className="w-full border rounded-lg p-3" rows={5} value={content} onChange={e=>setContent(e.target.value)} required />
        </div>

        <button disabled={loading} className={`w-full py-3 rounded-lg text-white font-semibold ${loading ? "bg-gray-400" : "bg-emerald-700 hover:bg-emerald-800"}`}>
          {loading ? "등록 중..." : "등록"}
        </button>
      </form>
    </main>
  );
}

export async function getServerSideProps({ params }) {
  return { props: { slug: params.slug } };
          }
