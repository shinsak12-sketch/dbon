// pages/stagram/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());

function timeAgo(value) {
  const d = typeof value === "number" ? new Date(value) : new Date(value || 0);
  const diff = (Date.now() - d.getTime()) / 1000; // 초

  if (!isFinite(diff) || diff < 0) return "";

  if (diff < 60) return `${Math.floor(diff)}초 전`;
  if (diff < 60 * 60) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 60 * 60 * 24) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 60 * 60 * 24 * 7) return `${Math.floor(diff / 86400)}일 전`;

  return d.toLocaleDateString("ko-KR");
}

export default function StagramFeed() {
  const { data, error, isLoading } = useSWR(
    "/api/stagram/feed?page=1&size=20",
    fetcher,
    { revalidateOnFocus: false }
  );

  const posts = data?.items || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* 헤더 + 우측 버튼 */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
              DB ON Stagram
            </h1>
            <p className="mt-1 text-sm text-emerald-900/70">
              사내 일상과 소식을 함께 나누는 디비온스타그램
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <Link
              href="/choose"
              className="inline-flex items-center rounded-full border border-emerald-700/30 bg-white/80 px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-800 hover:bg-white"
            >
              ← 선택으로
            </Link>
            <Link
              href="/stagram/new"
              className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              ＋ 글쓰기
            </Link>
          </div>
        </header>

        {/* 상태 표시 */}
        {isLoading && (
          <div className="rounded-2xl border bg-white/80 p-4 text-sm text-gray-600">
            피드를 불러오는 중입니다…
          </div>
        )}
        {error && (
          <div className="rounded-2xl border bg-white/80 p-4 text-sm text-rose-600">
            피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        )}

        {/* 피드 리스트 */}
        <section className="space-y-4">
          {posts.length === 0 && !isLoading && !error && (
            <div className="rounded-2xl border bg-white/80 p-6 text-center text-sm text-gray-500">
              아직 등록된 디비온스타그램이 없습니다. 첫 글을 남겨 보세요!
            </div>
          )}

          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              {/* 상단: 아바타 + 이름 + 시간 */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                  {post.author?.[0] || "익"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">
                      {post.author || "익명"}
                    </span>
                    {post.dept && (
                      <span className="text-xs text-gray-500">
                        ({post.dept})
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {timeAgo(post.createdAt)}
                  </div>
                </div>
                {/* 우측 더보기 자리만 확보 */}
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  aria-label="더보기"
                >
                  …
                </button>
              </div>

              {/* 본문 */}
              <div className="mt-3 space-y-2">
                {post.title && (
                  <h2 className="text-sm font-semibold text-gray-900">
                    {post.title}
                  </h2>
                )}
                {post.content && (
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {post.content}
                  </p>
                )}

                {/* 태그 */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* 이미지들 */}
                {Array.isArray(post.images) && post.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {post.images.map((img) => (
                      <div
                        key={img}
                        className="relative overflow-hidden rounded-xl border bg-gray-50"
                      >
                        <img
                          src={`/api/stagram/upload?name=${encodeURIComponent(
                            img
                          )}`}
                          alt=""
                          className="h-28 w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 하단: 좋아요/댓글 카운트 (기본 값) */}
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span role="img" aria-label="like">
                    ❤️
                  </span>
                  {post.likes ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <span role="img" aria-label="comment">
                    💬
                  </span>
                  {post.comments ?? 0}
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
