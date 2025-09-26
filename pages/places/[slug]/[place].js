// pages/places/[slug]/[place].js
import prisma from "../../../lib/prisma";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

export async function getServerSideProps({ params }) {
  const regionSlug = params.slug;
  const placeSlug  = params.place;

  const place = await prisma.place.findUnique({
    where: { slug: placeSlug },
    include: {
      region: true,
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!place) return { notFound: true };

  if (place.region?.slug && place.region.slug !== regionSlug) {
    return {
      redirect: {
        destination: `/places/${place.region.slug}/${place.slug}`,
        permanent: true,
      },
    };
  }

  return { props: { place } };
}

function Stars({ value = 0, size = "text-lg" }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className={`inline-flex items-center ${size} leading-none`}>
      {"★".repeat(full)}
      {half ? "☆" : ""}
      {"☆".repeat(empty)}
    </div>
  );
}

export default function PlaceDetail({ place }) {
  const router = useRouter();
  const regionSlug = place.region?.slug;
  const addressText = place.address || "";
  const ratingText = (place.avgRating || 0).toFixed(1);

  const [imgErr, setImgErr] = useState(false);
  const hasImage = !!place.coverImage && /^https?:\/\//i.test(place.coverImage);

  // 메뉴/삭제/수정 모달 상태
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePwd, setDeletePwd] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editPwd, setEditPwd] = useState("");
  const [editing, setEditing] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") return window.location.href;
    return `/places/${regionSlug}/${place.slug}`;
  }, [regionSlug, place.slug]);

  const onCopyAddress = async () => {
    try {
      await navigator?.clipboard?.writeText(addressText || "");
      alert("주소를 복사했습니다.");
    } catch {
      alert("복사 실패. 길게 눌러 직접 복사해 주세요.");
    }
  };

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: place.name,
          text: "디비슐랭 맛집",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("링크를 복사했습니다.");
      }
    } catch {}
  };

  // 수정 시작: 비밀번호 모달 열기
  const openEdit = () => {
    setMenuOpen(false);
    setEditOpen(true);
    setEditPwd("");
  };

  // 수정 확정: 비번을 세션에 저장 후 등록화면(edit 모드)로 이동
  const confirmEdit = () => {
    if (!editPwd.trim()) {
      alert("수정 비밀번호를 입력해 주세요.");
      return;
    }
    setEditing(true);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`placeEditPw:${place.slug}`, editPwd.trim());
      }
      router.push(`/places/${regionSlug}/new?edit=${place.slug}`);
    } finally {
      setEditing(false);
      setEditOpen(false);
    }
  };

  const doDelete = async () => {
    if (!deletePwd.trim()) {
      alert("삭제 비밀번호를 입력해 주세요.");
      return;
    }
    setDeleting(true);
    try {
      const r = await fetch(`/api/places/${place.slug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePwd }),
      });
      const data = await r.json();
      if (!r.ok) {
        alert(data?.error || "삭제 실패");
        return;
      }
      router.replace(`/regions/${regionSlug}`);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setMenuOpen(false);
      setDeletePwd("");
    }
  };

  return (
    <main className="mx-auto max-w-2xl">
      {/* 히어로(커버) */}
      <div className="relative">
        {hasImage && !imgErr ? (
          <img
            src={place.coverImage}
            alt={place.name}
            className="h-56 w-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="h-56 w-full flex items-center justify-center bg-gray-100 text-gray-500">
            등록된 이미지가 없습니다
          </div>
        )}

        {/* 상단 투명 헤더 영역 */}
        <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between">
          <button
            onClick={() => router.push(`/regions/${regionSlug}`)}
            className="rounded-full bg-black/40 text-white px-3 py-1 text-sm"
          >
            ← 목록
          </button>
          <span className="rounded-full bg-black/40 text-white px-3 py-1 text-xs">
            {place.region?.name || "지역"}
          </span>
        </div>
      </div>

      {/* 본문 카드 */}
      <section className="p-4 sm:p-6 -mt-6 sm:-mt-8 relative">
        <div className="rounded-2xl border bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3 relative">
            <div>
              <h1 className="text-2xl font-extrabold text-emerald-800">{place.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <span className="text-yellow-500 font-bold">★ {ratingText}</span>
                <span className="text-gray-400">·</span>
                <span>리뷰 {place.reviewsCount || place.reviews?.length || 0}개</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* ⋯ 메뉴 버튼 */}
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-xl border px-3 py-2 text-xl leading-none hover:bg-gray-50"
                aria-label="더보기"
              >
                ⋯
              </button>

              {/* 드롭다운 */}
              {menuOpen && (
                <div className="absolute right-0 top-12 z-10 w-40 overflow-hidden rounded-xl border bg-white shadow-lg">
                  <button
                    onClick={() => { onShare(); setMenuOpen(false); }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    공유하기
                  </button>
                  <button
                    onClick={openEdit}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    수정하기
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                    className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                  >
                    삭제하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {(place.address || place.mapUrl) && (
            <div className="mt-4 rounded-xl border bg-gray-50 p-3">
              {place.address && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-gray-700 text-sm">{place.address}</p>
                  <button
                    onClick={onCopyAddress}
                    className="shrink-0 rounded-lg border px-2 py-1 text-xs hover:bg-white"
                  >
                    복사
                  </button>
                </div>
              )}
              {place.mapUrl && (
                <div className="mt-2">
                  <a
                    href={place.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                  >
                    네이버지도 열기
                  </a>
                </div>
              )}
            </div>
          )}

          {(place.description || place.author) && (
            <div className="mt-4 rounded-xl border bg-emerald-50 p-4 text-gray-800">
              {place.description && <p className="whitespace-pre-line">{place.description}</p>}
              {place.author && <p className="mt-2 text-sm text-gray-600">— {place.author}</p>}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href={`/places/${place.slug}/review`}
              className="rounded-xl bg-emerald-700 px-4 py-3 text-center font-semibold text-white hover:bg-emerald-800"
            >
              리뷰 작성
            </Link>
            <Link
              href={`/regions/${regionSlug}`}
              className="rounded-xl border px-4 py-3 text-center font-semibold hover:bg-gray-50"
            >
              목록으로
            </Link>
          </div>
        </div>

        {/* 리뷰 리스트 */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold">리뷰</h2>
          {(!place.reviews || place.reviews.length === 0) && (
            <div className="mt-3 rounded-2xl border bg-white p-5 text-gray-600">
              아직 리뷰가 없습니다. 첫 리뷰의 주인공이 되어 주세요!
            </div>
          )}
          <ul className="mt-3 space-y-3">
            {place.reviews?.map((r) => (
              <li key={r.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 font-bold">★ {r.rating}</span>
                    {r.author && <span className="text-sm text-gray-600">· {r.author}</span>}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                {r.imageUrl && /^https?:\/\//i.test(r.imageUrl) && (
                  <div className="mt-3">
                    <img
                      src={r.imageUrl}
                      alt="review"
                      className="w-full rounded-xl border"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <p className="mt-3 text-gray-800 whitespace-pre-line">{r.content}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 삭제 모달 */}
      {deleteOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h3 className="text-lg font-bold">맛집 삭제</h3>
            <p className="mt-1 text-sm text-gray-600">등록 시 설정한 비밀번호를 입력하세요.</p>

            <input
              type="password"
              value={deletePwd}
              onChange={(e) => setDeletePwd(e.target.value)}
              placeholder="비밀번호"
              className="mt-4 w-full rounded-lg border p-3"
              autoFocus
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => { setDeleteOpen(false); setDeletePwd(""); }}
              >
                취소
              </button>
              <button
                disabled={deleting}
                onClick={doDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 비밀번호 모달 */}
      {editOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h3 className="text-lg font-bold">맛집 수정</h3>
            <p className="mt-1 text-sm text-gray-600">등록 시 설정한 비밀번호를 입력하세요.</p>

            <input
              type="password"
              value={editPwd}
              onChange={(e) => setEditPwd(e.target.value)}
              placeholder="비밀번호"
              className="mt-4 w-full rounded-lg border p-3"
              autoFocus
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => { setEditOpen(false); setEditPwd(""); }}
              >
                취소
              </button>
              <button
                disabled={editing}
                onClick={confirmEdit}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {editing ? "확인 중…" : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
          }
