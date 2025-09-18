import { useState } from "react";
import prisma from "../../../lib/prisma";

export async function getServerSideProps({ params }) {
  const id = Number(params.id);
  const review = await prisma.review.findUnique({
    where: { id },
    include: { place: true }
  });
  if (!review) return { notFound: true };
  return { props: { review: JSON.parse(JSON.stringify(review)) } };
}

export default function EditReview({ review }) {
  const [rating, setRating] = useState(review.rating);
  const [content, setContent] = useState(review.content);
  const [author, setAuthor] = useState(review.author || "");
  const [imageUrl, setImageUrl] = useState(review.imageUrl || "");
  const [pin, setPin] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const res = await fetch(`/api/reviews/${review.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, content, author, imageUrl, pin })
    });
    const data = await res.json();
    if (res.ok) window.location.href = `/places/${review.place.slug}`;
    else alert(data.error || "수정 실패");
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">리뷰 수정</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium">별점</label>
          <input type="number" min="1" max="5" className="mt-1 w-full border rounded-lg p-3"
            value={rating} onChange={e=>setRating(Number(e.target.value))} required/>
        </div>
        <div>
          <label className="block text-sm font-medium">닉네임</label>
          <input className="mt-1 w-full border rounded-lg p-3" value={author} onChange={e=>setAuthor(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">이미지 URL</label>
          <input className="mt-1 w-full border rounded-lg p-3" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">리뷰 내용</label>
          <textarea rows={5} className="mt-1 w-full border rounded-lg p-3" value={content} onChange={e=>setContent(e.target.value)} required/>
        </div>
        <div>
          <label className="block text-sm font-medium">비밀번호</label>
          <input type="password" className="mt-1 w-full border rounded-lg p-3" value={pin} onChange={e=>setPin(e.target.value)} required/>
        </div>
        <button className="w-full py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800">
          저장
        </button>
      </form>
    </main>
  );
}
