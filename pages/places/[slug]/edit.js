// pages/places/[slug]/edit.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function PlaceEdit() {
  const router = useRouter();
  const { slug } = router.query;

  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    description: "",
    author: "",
    address: "",
    mapUrl: "",
    coverImage: "",
    password: "",
  });

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        // 단건 조회 (slug로)
        const r = await fetch(`/api/places/${slug}`);
        const data = await r.json();
        if (r.ok) {
          setPlace(data);
          setForm((prev) => ({
            ...prev,
            name: data.name || "",
            description: data.description || "",
            author: data.author || "",
            address: data.address || "",
            mapUrl: data.mapUrl || "",
            coverImage: data.coverImage || "",
          }));
        } else {
          alert(data.error || "로드 실패");
        }
      } catch (e) {
        console.error(e);
        alert("네트워크 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onUpdate = async () => {
    try {
      const r = await fetch(`/api/places/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data.error || "수정 실패");
        return;
      }
      alert("수정 완료");
      router.push(`/places/${slug}`);
    } catch (e) {
      console.error(e);
      alert("네트워크 오류");
    }
  };

  const onDelete = async () => {
    const password = prompt("삭제 비밀번호를 입력하세요");
    if (!password) return;
    try {
      const r = await fetch(`/api/places/${slug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data.error || "삭제 실패");
        return;
      }
      alert("삭제 완료");
      router.push("/regions");
    } catch (e) {
      console.error(e);
      alert("네트워크 오류");
    }
  };

  if (loading) return <main className="max-w-2xl mx-auto p-6">로딩중…</main>;
  if (!place) return <main className="max-w-2xl mx-auto p-6">존재하지 않습니다.</main>;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold">맛집 정보 수정</h1>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">가게명</label>
          <input name="name" value={form.name} onChange={onChange} className="mt-1 w-full border rounded-lg p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">소개글</label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={4}
            className="mt-1 w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">작성자</label>
          <input name="author" value={form.author} onChange={onChange} className="mt-1 w-full border rounded-lg p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">주소</label>
          <input name="address" value={form.address} onChange={onChange} className="mt-1 w-full border rounded-lg p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">네이버 지도 링크</label>
          <input name="mapUrl" value={form.mapUrl} onChange={onChange} className="mt-1 w-full border rounded-lg p-3" />
        </div>

        <div>
          <label className="block text-sm font-medium">대표 이미지 URL</label>
          <input
            name="coverImage"
            value={form.coverImage}
            onChange={onChange}
            className="mt-1 w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">수정 비밀번호</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="등록 시 설정한 비밀번호"
            className="mt-1 w-full border rounded-lg p-3"
          />
          <p className="text-xs text-gray-500 mt-1">
            비밀번호를 설정하지 않고 등록된 글은 수정/삭제가 제한될 수 있습니다.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onUpdate}
            className="flex-1 py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800"
          >
            저장
          </button>
          <button onClick={onDelete} className="px-4 py-3 rounded-lg bg-red-600 text-white font-semibold">
            삭제
          </button>
        </div>
      </div>
    </main>
  );
}
