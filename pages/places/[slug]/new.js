// pages/places/[slug]/new.js
import { useRouter } from "next/router";
import { useState } from "react";

export default function NewPlace() {
  const router = useRouter();
  const { slug: regionSlug } = router.query; // 지역 슬러그

  const [form, setForm] = useState({
    name: "",
    description: "",
    author: "",
    address: "",
    mapUrl: "",
    coverImage: "",
    password: "",
  });
  const [saving, setSaving] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!regionSlug) return alert("지역 정보를 불러오는 중입니다.");

    try {
      setSaving(true);
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, regionSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "등록 실패");
        return;
      }
      alert("등록 완료!");
      router.replace(`/places/${data.slug}`); // 상세로 이동
    } catch (e) {
      console.error(e);
      alert("네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold">맛집 등록</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">가게명 *</label>
          <input name="name" value={form.name} onChange={onChange} required className="mt-1 w-full border rounded p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">소개글</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={4} className="mt-1 w-full border rounded p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">작성자</label>
          <input name="author" value={form.author} onChange={onChange} className="mt-1 w-full border rounded p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">주소</label>
          <input name="address" value={form.address} onChange={onChange} className="mt-1 w-full border rounded p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">네이버 지도 링크</label>
          <input name="mapUrl" value={form.mapUrl} onChange={onChange} className="mt-1 w-full border rounded p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">대표 이미지 URL</label>
          <input name="coverImage" value={form.coverImage} onChange={onChange} className="mt-1 w-full border rounded p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">수정/삭제 비밀번호</label>
          <input type="password" name="password" value={form.password} onChange={onChange} className="mt-1 w-full border rounded p-3" />
          <p className="text-xs text-gray-500 mt-1">등록 후 수정/삭제에 사용됩니다.</p>
        </div>

        <button disabled={saving} className="w-full py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800">
          {saving ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </main>
  );
}
