// pages/stagram/index.js
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());

function getImageSrc(img) {
  if (!img) return "";
  const v = String(img);

  if (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("/") ||
    v.startsWith("data:")
  ) {
    return v;
  }

  return `/api/stagram/upload?name=${encodeURIComponent(v)}`;
}

export default function StagramHome() {
  const { data, mutate } = useSWR("/api/stagram/feed", fetcher, {
    revalidateOnFocus: false,
  });

  const posts = data?.items || data?.posts || [];

  const [activeImage, setActiveImage] = useState(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [commentText, setCommentText] = useState("");

  const { data: commentsData, mutate: mutateComments } = useSWR(
    openCommentsPostId
      ? `/api/stagram/comments?postId=${openCommentsPostId}`
      : null,
    fetcher
  );
  const comments = commentsData?.comments || [];

  const handleLike = async (postId) => {
    try {
      const res = await fetch("/api/stagram/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const json = await res.json();
      if (!json.ok) return;

      mutate(
        (prev) => {
          if (!prev) return prev;
          const list = prev.items || prev.posts || [];
          const newList = list.map((p) =>
            p.id === postId ? { ...p, likes: json.post.likes } : p
          );
          if (prev.items) return { ...prev, items: newList };
          if (prev.posts) return { ...prev, posts: newList };
          return prev;
        },
        false
      );
    } catch (e) {
      console.error(e);
    }
  };

  const toggleComments = (postId) => {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null);
      setCommentText("");
    } else {
      setOpenCommentsPostId(postId);
      setCommentText("");
    }
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentText.trim();
    if (!text) return;

    try {
      const res = await fetch("/api/stagram/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: text,
          authorName: "",
        }),
      });
      const json = await res.json();
      if (!json.ok) return;

      setCommentText("");
      mutateComments();

      mutate(
        (prev) => {
          if (!prev) return prev;
          const list = prev.items || prev.posts || [];
          const newList = list.map((p) =>
            p.id === postId
              ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
              : p
          );
          if (prev.items) return { ...prev, items: newList };
          if (prev.posts) return { ...prev, posts: newList };
          return prev;
        },
        false
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pb-16">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* 상단 헤더 영역 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-900">
              DB ON Stagram
            </h1>
            <p className="mt-1 text-sm text-emerald-900/70">
              사내 일상과 소식을 함께 나누는 디비온스타그램
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/choose"
              className="hidden sm:inline-flex items-center rounded-full border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              ← 선택으로
            </Link>
            <Link
              href="/stagram/new"
              className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
            >
              + 글쓰기
            </Link>
          </div>
        </div>

        {/* 모바일용 선택으로 버튼 */}
        <div className="sm:hidden mb-4">
          <Link
            href="/choose"
            className="inline-flex items-center rounded-full border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            ← 선택으로
          </Link>
        </div>

        {/* 피드 리스트 */}
        <div className="space-y-5">
          {posts.map((post) => {
            const authorName = post.authorName || post.author || "익명";
            const authorDept = post.authorDept || post.dept || "";
            const images = Array.isArray(post.imageUrls)
              ? post.imageUrls
              : Array.isArray(post.images)
              ? post.images
              : [];

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm border border-emerald-50"
              >
                {/* 상단 프로필 영역 */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    {authorName?.[0] || "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      {authorName}
                      {authorDept && (
                        <span className="text-gray-500 text-xs">
                          ({authorDept})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleString("ko-KR", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                </div>

                {/* 사진 먼저, 더 크게 */}
                {images.length > 0 && (
                  <div
                    className={`${
                      images.length === 1
                        ? "grid grid-cols-1"
                        : images.length === 2
                        ? "grid grid-cols-2 gap-1 px-4"
                        : "grid grid-cols-3 gap-1 px-4"
                    }`}
                  >
                    {images.map((img, idx) => {
                      const src = getImageSrc(img);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImage(src)}
                          className="relative overflow-hidden rounded-2xl bg-gray-100"
                        >
                          <img
                            src={src}
                            alt=""
                            className={`w-full object-cover ${
                              images.length === 1
                                ? "h-[320px] sm:h-[460px]"
                                : "h-[180px] sm:h-[240px]"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 내용 */}
                <div className="px-4 pt-4">
                  {post.title && (
                    <p className="text-base font-semibold text-gray-900 mb-2">
                      {post.title}
                    </p>
                  )}

                  {post.content && (
                    <p className="text-sm text-gray-900 whitespace-pre-line mb-3 leading-6">
                      {post.content}
                    </p>
                  )}

                  {/* 태그는 내용 아래 */}
                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, idx) => (
                        <span
                          key={`${tag}-${idx}`}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 하단 액션 영역 */}
                <div className="px-4 pb-4 flex items-center gap-4 text-sm text-gray-500">
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className="inline-flex items-center gap-1 hover:text-rose-500"
                  >
                    <span>❤️</span>
                    <span>{post.likes || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className="inline-flex items-center gap-1 hover:text-emerald-600"
                  >
                    <span>💬</span>
                    <span>{post.commentsCount || post.comments || 0}</span>
                  </button>
                </div>

                {/* 댓글 영역 */}
                {openCommentsPostId === post.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {comments.length === 0 && (
                        <p className="text-xs text-gray-400">
                          아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                        </p>
                      )}
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className="text-xs text-gray-800 bg-gray-50 rounded-2xl px-3 py-2"
                        >
                          <span className="font-semibold">
                            {c.authorName || "익명"}
                          </span>{" "}
                          <span className="text-gray-400">
                            ·{" "}
                            {new Date(c.createdAt).toLocaleString("ko-KR", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <div className="mt-1 whitespace-pre-line">
                            {c.content}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="댓글을 입력하세요"
                        className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleCommentSubmit(post.id)}
                        className="shrink-0 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        등록
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {posts.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-10">
              아직 등록된 게시글이 없습니다. 첫 번째 디비온스타그램을 올려보세요!
            </p>
          )}
        </div>
      </div>

      {/* 이미지 확대 오버레이 */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="max-w-5xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImage}
              alt=""
              className="max-h-[90vh] w-auto rounded-xl shadow-xl"
            />
          </div>
        </div>
      )}
    </main>
  );
}
