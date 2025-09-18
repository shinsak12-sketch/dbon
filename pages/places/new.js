import { useState } from "react";
import Uploader from "../../components/Uploader";

export default function NewPlace() {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");

  // slug 자동 생성 (한글 → 영어 변환은 간단히 예시)
  const makeSlug = (text) =>
    text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const slug = makeSlug(name);

    await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, region, address, mapUrl, coverImage }),
    });
    alert("등록 완료!");
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold">맛집 등록</h1>
      <p className="text-gray-500 mb-6">
        정확한 정보일수록 다른 이용자에게 도움이 됩니다 🙌
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">가게명 *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">지역 *</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">지역 선택</option>
            <option value="서울">서울</option>
            <option value="경기">경기</option>
            <option value="부산">부산</option>
            <option value="대구">대구</option>
            {/* 지역 더 추가 */}
          </select>
        </div>

        <div>
          <label className="block font-medium">주소 (선택)</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="예) 서울 중구 을지로 ..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium">네이버 지도 링크 (선택)</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://map.naver.com/..."
              className="flex-1 border rounded px-3 py-2"
            />
            <a
              href="https://map.naver.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 text-white rounded"
            >
              검색
            </a>
          </div>
        </div>

        <div>
          <label className="block font-medium">대표 이미지 *</label>
          <Uploader onUpload={setCoverImage} />
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-700 text-white font-semibold py-2 rounded"
        >
          등록
        </button>
      </form>
    </main>
  );
}
