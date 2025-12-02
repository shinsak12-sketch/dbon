// pages/stagram/index.js
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function StagramHome() {
  const { data, mutate } = useSWR("/api/stagram/feed", fetcher, {
    revalidateOnFocus: false,
  });

  // feed 응답 형태: { items: [...] } 또는 { posts: [...] } 둘 다 대응
  const posts = data?.items || data?.posts || [];

  const [activeImage, setActiveImage] = useState(null); // 확대용
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [commentText, setCommentText] = useState("");

  // 현재 열려있는 댓글들
  const {
    data: commentsData,
    mutate: mutateComments,
  } = useSWR(
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

      // 로컬 feed 갱신
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
        false // revalidate 안 함
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
          authorName: "", // 필요하면 나중에 로그인 정보 넣기
        }),
      });
      const json = await res.json();
      if (!json.ok) return;

      setCommentText("");
      // 댓글 목록 리프레시
      mutateComments();
      // 상단 카드의 commentsCount +1
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
        {/* 상단 헤더 영역 (페이지 안) */}
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
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl bg-white shadow-sm border border-emerald-50 p-4"
            >
              {/* 상단 프로필 영역 */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  {post.authorName?.[0] || "?"}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    {post.authorName || "익명"}
                    {post.authorDept && (
                      <span className="text-gray-500 text-xs">
                        ({post.authorDept})
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

              {/* 본문 */}
              {post.content && (
                <p className="text-sm text-gray-900 whitespace-pre-line mb-3">
                  {post.content}
                </p>
              )}

              {/* 이미지들 */}
              {Array.isArray(post.imageUrls) && post.imageUrls.length > 0 && (
                <div className="mt-2 mb-3 grid grid-cols-3 gap-2">
                  {post.imageUrls.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      className="relative overflow-hidden rounded-xl border border-gray-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-28 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* 해시태그(있다면) – content에서 #단어만 뽑았던 구조라면 여기에 표시 가능, 지금은 스킵 */}

              {/* 하단 액션 영역 */}
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
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
                  <span>{post.commentsCount || 0}</span>
                </button>
              </div>

              {/* 댓글 영역 */}
              {openCommentsPostId === post.id && (
                <div className="mt-3 border-t border-gray-100 pt-3 space-y-3">
                  {/* 댓글 리스트 */}
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

                  {/* 댓글 입력 */}
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
          ))}

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
            className="max-w-3xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
