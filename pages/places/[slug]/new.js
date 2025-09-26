// pages/places/[slug]/new.js
import prisma from "../../../lib/prisma";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Uploader from "../../../components/Uploader";

export async function getServerSideProps({ params }) {
  const region = await prisma.region.findUnique({ where: { slug: params.slug } });
  if (!region) return { notFound: true };
  return { props: { region } };
}

function Label({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-gray-800">
      {children}
      {required && <span className="ml-1 text-rose-500">*</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border p-3 bg-white/95 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500";

const TextInput = ({ className = "", ...props }) => (
  <input {...props} className={`${inputBase} ${className}`} />
);

export default function NewPlace({ region }) {
  const router = useRouter();
  const nameRef = useRef(null);

  // edit 모드 여부: /places/[region]/new?edit=[placeSlug]
  const editSlug = typeof router.query.edit === "string" ? router.query.edit : "";
  const isEdit = Boolean(editSlug);

  const [form, setForm] = useState({
  name: "",
  address: "",
  mapUrl: "",
  coverImages: [],   // 🔥 배열로 변경
  description: "",
  author: "",
  ownerPass: "",
});

  // 수정용 비밀번호(수정 시 필수)
  const [editPassword, setEditPassword] = useState("");

  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 네이버 자동검색 상태
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  const onChange = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));

  // 업로더 콜백 (여러 장)
const onUploaded = (urls) =>
  setForm((f) => ({ ...f, coverImages: urls || [] }));

  // 네이버에서 찾기 버튼 토글 (가게명 아래)
  const toggleSearch = () => setSearchOpen((v) => !v);

  // 🔎 디바운스 검색: 타이핑 후 350ms
  useEffect(() => {
    if (!searchOpen) return;
    const q = (query || form.name || "").trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const r = await fetch(`/api/naver-search?query=${encodeURIComponent(q)}`);
        const items = await r.json();
        setResults(Array.isArray(items) ? items : []);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [query, form.name, searchOpen]);

  // 검색 결과 선택 → 가게명/주소/지도링크 자동 채움
  const selectPlace = (item) => {
    const title = String(item.title || "").replace(/<[^>]+>/g, "");
    const address = item.roadAddress || item.address || "";
    const mapUrl = title ? `https://map.naver.com/v5/search/${encodeURIComponent(title)}` : "";

    setForm((f) => ({
      ...f,
      name: title || f.name,
      address: address || f.address,
      mapUrl: mapUrl || f.mapUrl,
    }));
    setResults([]);
    setSearchOpen(false);
  };

  // ▶️ edit 모드면 기존 데이터 불러오기
  useEffect(() => {
    if (!isEdit || !editSlug) return;
    (async () => {
      try {
        const r = await fetch(`/api/places/${editSlug}`);
        const data = await r.json();
        if (!r.ok) {
          alert(data?.error || "로드 실패");
          return;
        }
        setForm((f) => ({
  ...f,
  name: data.name || "",
  address: data.address || "",
  mapUrl: data.mapUrl || "",
  coverImages: data.coverImages || [],   // 🔥 배열 반영
  description: data.description || "",
  author: data.author || "",
}));
      } catch (e) {
        console.error(e);
        alert("네트워크 오류");
      }
    })();
  }, [isEdit, editSlug]);

  // 제출
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("가게명을 입력해 주세요.");
      nameRef.current?.focus();
      return;
    }

    if (isEdit) {
      // 수정 모드 → 비번 필수
      if (!editPassword.trim()) {
        alert("수정 비밀번호를 입력해 주세요.");
        return;
      }
    } else {
      // 등록 모드 → 안내 동의 필요
      if (!agree) {
        alert("안내에 동의해 주세요.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        // PUT /api/places/[placeSlug]
        const r = await fetch(`/api/places/${editSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            password: editPassword, // 서버에서 ownerPassHash 검증
          }),
        });
        const data = await r.json();
        if (!r.ok) {
          alert(data?.error || "수정 실패");
          return;
        }
        // 상세로 이동
        router.replace(`/places/${region.slug}/${data.slug || editSlug}`);
      } else {
        // POST /api/places
        const r = await fetch("/api/places", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
  regionSlug: region.slug,
  ...form, // coverImages 배열 포함
}),
        });
        const data = await r.json();
        if (!r.ok) {
          alert(data?.error || "등록 실패");
          return;
        }
        // 등록 성공 → 성공 페이지로
        router.replace(
          `/places/success?region=${encodeURIComponent(region.slug)}&place=${encodeURIComponent(
            data.place.slug
          )}`
        );
      }
    } catch (e) {
      console.error(e);
      alert("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-emerald-800">
          {isEdit ? "맛집 수정" : "맛집 등록"}
        </h1>
        {!isEdit && (
          <p className="mt-1 text-gray-600">정확한 정보일수록 모두에게 도움이 됩니다 🙌</p>
        )}
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border bg-white p-6 shadow-sm">
        {/* 가게명 */}
        <div className="space-y-2">
          <Label required>가게명</Label>
          <TextInput
            ref={nameRef}
            name="name"
            value={form.name}
            onChange={onChange}
            onInput={(e) => setQuery(e.currentTarget.value)}
            placeholder="예) 부대찌개대사관"
            aria-label="가게명"
          />

          {/* 가게명 바로 아래: 네이버에서 찾기 */}
          {!isEdit && (
            <div className="mt-2">
              <button
                type="button"
                onClick={toggleSearch}
                className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
              >
                네이버에서 찾기
              </button>

              {searchOpen && (
                <div className="mt-3 rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">가게명을 타이핑하면 자동으로 검색됩니다.</span>
                    {searching && <span className="text-xs text-gray-400">검색 중…</span>}
                  </div>

                  {/* 드롭다운 결과 */}
                  {results.length > 0 && (
                    <ul className="mt-3 divide-y rounded-xl border">
                      {results.map((item, idx) => {
                        const title = String(item.title || "").replace(/<[^>]+>/g, "");
                        return (
                          <li
                            key={idx}
                            className="cursor-pointer p-3 hover:bg-gray-50"
                            onClick={() => selectPlace(item)}
                          >
                            <div className="font-semibold">{title}</div>
                            <div className="text-sm text-gray-600">
                              {item.roadAddress || item.address}
                            </div>
                            {item.category && (
                              <div className="mt-0.5 text-xs text-gray-400">{item.category}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {!searching && results.length === 0 && (
                    <p className="mt-3 text-sm text-gray-500">검색 결과가 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 지역(고정 표시) */}
        <div className="mt-6 space-y-2">
          <Label required>지역</Label>
          <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {region.name} <span className="text-gray-400">({region.slug})</span>
          </div>
          {!isEdit && <p className="text-xs text-gray-400">선택한 지역에 등록됩니다.</p>}
        </div>

        {/* 주소/지도 링크 */}
        <div className="mt-6 space-y-2">
          <Label>주소</Label>
          <TextInput
            name="address"
            value={form.address}
            onChange={onChange}
            placeholder="도로명 주소"
            aria-label="주소"
          />
          <Label>네이버 지도 링크 (선택)</Label>
          <TextInput
            name="mapUrl"
            value={form.mapUrl}
            onChange={onChange}
            placeholder="https://map.naver.com/…"
            aria-label="네이버 지도 링크"
          />
        </div>

        {/* 이미지 첨부 (선택) */}
        <div className="mt-6">
  <Label>이미지 첨부 (선택)</Label>
  <div className="mt-2">
    <Uploader
      onUploaded={onUploaded}
      label="이미지 선택"
      defaultUrls={form.coverImages}   // 🔥 여러 장 기본값
    />
  </div>
  {/* URL 배열을 hidden input에 JSON 문자열로 저장 */}
  <input type="hidden" name="coverImages" value={JSON.stringify(form.coverImages || [])} />
</div>

        {/* 소개글 / 작성자 */}
        <div className="mt-6">
          <Label>소개글</Label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={4}
            placeholder="가게 소개, 추천 메뉴 등"
            className="mt-2 w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

        {/* 등록 모드: 수정/삭제 비밀번호(선택) */}
        {!isEdit && (
          <div className="mt-6">
            <Label>수정/삭제 비밀번호 (선택)</Label>
            <TextInput
              type="password"
              name="ownerPass"
              value={form.ownerPass}
              onChange={onChange}
              placeholder="나중에 수정/삭제할 때 필요합니다"
              aria-label="수정/삭제 비밀번호"
            />
          </div>
        )}

        {/* 수정 모드: 수정 비밀번호(필수) */}
        {isEdit && (
          <div className="mt-6">
            <Label required>수정 비밀번호</Label>
            <TextInput
              type="password"
              name="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="등록 시 설정한 비밀번호"
              aria-label="수정 비밀번호"
              required
            />
          </div>
        )}

        {/* 동의 (등록 모드에서만) */}
        {!isEdit && (
          <div className="mt-6">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1"
                aria-label="등록 안내 동의"
              />
              <span className="text-gray-700">
                허위/무단 정보는 삭제될 수 있으며, 등록한 정보는 서비스 내에서 공개됩니다.
              </span>
            </label>
          </div>
        )}

        {/* 하단 액션바 */}
        <div className="sticky bottom-0 mt-8 -mx-6 border-t bg-white/90 p-4 backdrop-blur">
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting ? (isEdit ? "수정 중…" : "등록 중…") : isEdit ? "수정 저장" : "등록"}
            </button>
            <Link
              href={isEdit ? `/places/${region.slug}/${editSlug}` : `/regions/${region.slug}`}
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
