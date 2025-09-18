import prisma from "../../../lib/prisma";
import { useState } from "react";

export async function getServerSideProps({ params }) {
  const id = Number(params.id);
  const review = await prisma.review.findUnique({
    where: { id },
    include: { place: true }
  });
  if (!review) return { notFound: true };
  return { props: { review: JSON.parse(JSON.stringify(review)) } };
}

export default function DeleteReview({ review }) {
  const [pin, setPin] = useState("");

  async function onDelete(e) {
    e.preventDefault();
    const res = await fetch(`/api/reviews/${review.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    if (res.ok) window.location.href = `/places/${review.place.slug}`;
    else alert(data.error || "삭제 실패");
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold">리뷰 삭제</h1>
      <p className="text-gray-600 mt-2">“{review.content.slice(0, 30)}...” 삭제</p>
      <form className="mt-6 space-y-4" onSubmit={onDelete}>
        <div>
          <label className="block text-sm font-medium">비밀번호</label>
          <input type="password" className="mt-1 w-full border rounded-lg p-3" value={pin} onChange={e=>setPin(e.target.value)} required/>
        </div>
        <button className="w-full py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">
          삭제
        </button>
      </form>
    </main>
  );
}
