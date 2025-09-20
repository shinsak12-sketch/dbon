// pages/places/[slug]/new.js
import prisma from "../../../lib/prisma";
import { useRouter } from "next/router";
import { useRef, useState } from "react";

export async function getServerSideProps({ params }) {
  const region = await prisma.region.findUnique({
    where: { slug: params.slug },
  });
  if (!region) return { notFound: true };
  return { props: { region } };
}

export default function NewPlace({ region }) {
  const router = useRouter();
  const nameRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    mapUrl: "",
    coverImage: "",
    description: "",
    author: "",
    password: "",
  });
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // ✅ '네이버에서 찾기' → 가게명으로 바로 검색
  const openNaverSearch = () => {
    const q = (form.name || "").trim();
    if (!q) {
      alert("먼저 가게명을 입력해 주세요.");
      nameRef.current?.focus();
      return;
    }
    const url = `https://map.naver.com/v5/search/${encodeURIComponent(q)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert("가게명을 입력해 주세요.");
      nameRef.current?.focus();
      return;
    }
    if (!form.coverImage.trim()) {
      alert("대표 이미지 URL을 입력해 주세요.");
      return;
    }
    if (!agree) {
      alert("안내에 동의해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      // 서버에 새 맛집 생성 요청
      const r = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionSlug: region.slug, // 선택된 지역에 등록
          ...form,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data?.error || "등록 실패");
        return;
      }
      // 등록 성공 → 해당 지역 목록으로
      alert("등록되었습니다!");
      router.push(`/places/${region.slug}`);
    } catch (e) {
      console.error(e);
      alert("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-emerald-800">맛집 등록</h1>
      <p className="text-gray-500 mt-1">
        정확한 정보일수록 모두에게 도움이 됩니다 🙌
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        {/* 가게명 */}
        <div>
          <label className="block font-semibold mb-1">가게명 *</label>
          <input
            ref={nameRef}
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="예) 부대찌개대사관"
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        {/* 지역 (고정 표시) */}
        <div>
          <label className="block font-semibold mb-1">지역 *</label>
          <input
            value={region.slug}
            readOnly
            className="w-full rounded-xl border px-4 py-3 bg-gray-50 text-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            선택한 지역(<b>{region.name}</b>)에 등록됩니다.
          </p>
        </div>

        {/* 주소/지도 */}
        <div>
          <label className="block font-semibold mb-1">주소/지도</label>
          <input
            name="address"
            value={form.address}
            onChange={onChange}
            placeholder="주소 (선택)"
            className="w-full rounded-xl border px-4 py-3"
          />
          <input
            name="mapUrl"
            value={form.mapUrl}
            onChange={onChange}
            placeholder="네이버 지도 링크 (선택)"
            className="w-full rounded-xl border px-4 py-3 mt-2"
          />

          {/* ✅ 지도열기 제거 / 네이버에서 찾기 = 검색 */}
          <button
            type="button"
            onClick={openNaverSearch}
            className="mt-3 rounded-xl bg-emerald-700 text-white px-4 py-2 font-semibold hover:bg-emerald-800"
          >
            네이버에서 찾기
          </button>
        </div>

        {/* 대표 이미지 */}
        <div>
          <label className="block font-semibold mb-1">대표 이미지 URL *</label>
          <input
            name="coverImage"
            value={form.coverImage}
            onChange={onChange}
            placeholder="https://…"
            className="w-full rounded-xl border px-4 py-3"
          />
          <p className="text-xs text-gray-500 mt-1">
            이미지를 업로드했다면 해당 URL을 붙여넣어 주세요.
          </p>
        </div>

        {/* 소개글 / 작성자 */}
        <div>
          <label className="block font-semibold mb-1">소개글</label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={5}
            placeholder="간단 소개, 추천 메뉴 등"
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">작성자</label>
          <input
            name="author"
            value={form.author}
            onChange={onChange}
            placeholder="닉네임 (선택)"
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block font-semibold mb-1">
            수정/삭제 비밀번호 (선택)
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="글 수정/삭제 시 사용할 비밀번호"
            className="w-full rounded-xl border px-4 py-3"
          />
        </div>

        {/* 동의 */}
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          허위/무단 정보는 삭제될 수 있으며, 등록한 정보는 서비스 내에서
          공개됩니다.
        </label>

        {/* 제출 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-emerald-700 text-white px-4 py-3 font-semibold hover:bg-emerald-800 disabled:opacity-60"
          >
            {submitting ? "등록 중…" : "등록"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-3 rounded-xl border font-semibold hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      </form>
    </main>
  );
}
