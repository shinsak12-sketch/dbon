import { useState } from "react";

export default function NewPlace() {
  const [form, setForm] = useState({
    name: "",
    region: "",
    address: "",
    mapUrl: "",
    coverImage: "",
    description: "",
    author: "",
    ownerPass: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        alert("맛집이 등록되었습니다!");
        setForm({
          name: "",
          region: "",
          address: "",
          mapUrl: "",
          coverImage: "",
          description: "",
          author: "",
          ownerPass: "",
        });
      } else {
        const err = await res.json();
        alert("에러 발생: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">맛집 등록</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">가게명 *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="예) 부대찌개대사관"
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">지역 *</label>
          <input
            type="text"
            name="region"
            value={form.region}
            onChange={handleChange}
            placeholder="예) 서울"
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">주소 (선택)</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="서울 중구 ..."
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">네이버 지도 링크 (선택)</label>
          <input
            type="text"
            name="mapUrl"
            value={form.mapUrl}
            onChange={handleChange}
            placeholder="https://map.naver.com/..."
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">대표 이미지 (선택)</label>
          <input
            type="text"
            name="coverImage"
            value={form.coverImage}
            onChange={handleChange}
            placeholder="이미지 URL"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">소개글 (선택)</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="가게 소개, 추천 메뉴 등"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">작성자 (선택)</label>
          <input
            type="text"
            name="author"
            value={form.author}
            onChange={handleChange}
            placeholder="닉네임"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">비밀번호 (선택)</label>
          <input
            type="password"
            name="ownerPass"
            value={form.ownerPass}
            onChange={handleChange}
            placeholder="수정/삭제 시 필요합니다"
            className="w-full border p-2 rounded"
          />
          <p className="text-sm text-gray-500">※ 비밀번호를 입력하면 나중에 본인만 수정/삭제 가능합니다.</p>
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          등록
        </button>
      </form>
    </div>
  );
}
