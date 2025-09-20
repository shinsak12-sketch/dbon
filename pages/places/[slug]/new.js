// pages/places/[slug]/new.js
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Uploader from "../../../components/Uploader";

function Label({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-gray-800">
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl border p-3 bg-white/95 " +
        "placeholder:text-gray-400 " +
        "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 " +
        (props.className || "")
      }
    />
  );
}

export default function NewPlace() {
  const router = useRouter();
  const regionSlug = String(router.query.slug || "");

  const [form, setForm] = useState({
    name: "",
    description: "",
    author: "",
    address: "",
    mapUrl: "",
    coverImage: "",
    ownerPass: "",
    agree: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onUploaded = (url) => setForm((f) => ({ ...f, coverImage: url || "" }));

  const openNaverSearch = () => {
    const q = form.name || form.address || "";
    const url = `https://map.naver.com/p/search/${encodeURIComponent(q)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openMap = () => {
    const url = form.mapUrl?.trim()
      ? form.mapUrl.trim()
      : form.address
      ? `https://map.naver.com/p/search/${encodeURIComponent(form.address)}`
      : "https://map.naver.com";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("가게명을 입력하세요.");
    if (!form.coverImage.trim()) return alert("대표 이미지를 선택/입력하세요.");
    if (!form.agree) return alert("안내에 동의해 주세요.");

    try {
      setSubmitting(true);
      const r = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, regionSlug }),
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data.error || "등록 실패");
        return;
      }
      alert("등록 완료!");
      router.replace(`/places/${data.place.slug}`);
    } catch (err) {
      console.error(err);
      alert("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-emerald-800">맛집 등록</h1>
        <p className="mt-1 text-gray-600">
          정확한 정보일수록 모두에게 도움이 됩니다 🙌
        </p>
      </div>

      {/* 카드 */}
      <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-6 shadow-sm">
        {/* 가게명 */}
        <div className="space-y-2">
          <Label required>가게명</Label>
          <TextInput
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="예) 부대찌개대사관"
            aria-label="가게명"
          />
        </div>

        {/* 지역(고정) */}
        <div className="mt-6 space-y-2">
          <Label required>지역</Label>
          <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {regionSlug || "지역 미지정"}
          </div>
          <p className="text-xs text-gray-400">선택한 지역에 등록됩니다.</p>
        </div>

        {/* 주소/지도 */}
        <div className="mt-6 space-y-3">
          <Label>주소/지도</Label>
          <TextInput
            name="address"
            value={form.address}
            onChange={onChange}
            placeholder="주소 (선택)"
            aria-label="주소"
          />

          <div className="flex gap-2">
            <TextInput
              name="mapUrl"
              value={form.mapUrl}
              onChange={onChange}
              placeholder="네이버 지도 링크 (선택)"
              aria-label="네이버 지도 링크"
              className="flex-1"
            />
            <button
              type="button"
              onClick={openMap}
              className="shrink-0 rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
            >
              지도열기
            </button>
          </div>

          <button
            type="button"
            onClick={openNaverSearch}
            className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
          >
            네이버에서 찾기
          </button>
        </div>

        {/* 대표 이미지 */}
        <div className="mt-6">
          <Label required>대표 이미지</Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Uploader onUploaded={onUploaded} />
            <span className="text-xs text-gray-500">
              업로드하면 자동으로 URL이 채워집니다. (직접 붙여넣기도 가능)
            </span>
          </div>
          <TextInput
            name="coverImage"
            value={form.coverImage}
            onChange={onChange}
            placeholder="이미지 URL"
            aria-label="대표 이미지 URL"
            className="mt-2"
          />
          {form.coverImage && (
            <div className="mt-3">
              <img
                src={form.coverImage}
                alt="미리보기"
                className="w-full rounded-xl border"
              />
            </div>
          )}
        </div>

        {/* 소개글 / 작성자 */}
        <div className="mt-6">
          <Label>소개글</Label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={4}
            className="mt-2 w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="가게 소개, 추천 메뉴 등"
            aria-label="소개글"
          />
        </div>

        <div className="mt-6">
          <Label>작성자</Label>
          <TextInput
            name="author"
            value={form.author}
            onChange={onChange}
            placeholder="닉네임 (선택)"
            aria-label="작성자"
          />
        </div>

        {/* 비밀번호 */}
        <div className="mt-6">
          <Label>수정/삭제 비밀번호</Label>
          <TextInput
            type="password"
            name="ownerPass"
            value={form.ownerPass}
            onChange={onChange}
            placeholder="나중에 수정/삭제할 때 필요합니다"
            aria-label="수정/삭제 비밀번호"
          />
          <p className="mt-1 text-xs text-gray-500">
            설정하지 않으면 이후 수정/삭제가 제한될 수 있어요.
          </p>
        </div>

        {/* 동의 */}
        <div className="mt-6">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) =>
                setForm((f) => ({ ...f, agree: e.target.checked }))
              }
              className="mt-1"
              aria-label="등록 안내 동의"
            />
            <span className="text-gray-700">
              허위/무단 정보는 삭제될 수 있으며, 등록한 정보는 서비스 내에서 공개됩니다.
            </span>
          </label>
        </div>

        {/* 하단 액션바(고정) */}
        <div className="sticky bottom-0 mt-8 -mx-6 border-t bg-white/90 p-4 backdrop-blur">
          <div className="flex gap-2">
            <button
              disabled={submitting}
              className="flex-1 rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting ? "등록 중…" : "등록"}
            </button>
            <Link
              href={`/places/${regionSlug}`}
              className="rounded-xl border px-4 py-3 font-semibold hover:bg-gray-50"
            >
              취소
            </Link>
          </div>
        </div>
      </form>
    </main>
  );
}
