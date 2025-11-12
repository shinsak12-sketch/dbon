import useSWR from "swr";
import Link from "next/link";
import { useMemo } from "react";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function StagramHome() {
  const { data, error, isLoading } = useSWR("/api/stagram/list", fetcher, {
    revalidateOnFocus: false,
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-6">
      {/* 타이틀 */}
      <header className="mt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-800">
          DB ON Stagram
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          사내 일상과 소식을 함께 나누는 디비온스타그램
        </p>
      </header>

      {/* 우측 상단 컨트롤 영역 (디비슐랭의 ‘선택으로’ 위치와 동일) */}
      <div className="flex items-center justify-end gap-2">
        <Link
          href="/choose"
          className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          ← 선택으로
        </Link>
        <Link
          href="/stagram/new"
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + 글쓰기
        </Link>
      </div>

      {/* 피드 */}
      {isLoading && (
        <div className="rounded-2xl border bg-white p-6 text-gray-600">
          불러오는 중…
        </div>
      )}
      {error && (
        <div className="rounded-2xl border bg-white p-6 text-rose-600">
          데이터를 불러오지 못했습니다.
        </div>
      )}

      <section className="space-y-4">
        {items.map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm"
          >
            {/* 작성자/메타 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold">
                  {post.author?.[0] ?? "?"}
                </div>
                <div>
                  <div className="font-semibold">
                    {post.author ?? "익명"}{" "}
                    {post.dept ? (
                      <span className="text-gray-500 text-sm">({post.dept})</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-500">
                    {post.timeAgo ?? ""}
                  </div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">⋯</button>
            </div>

            {/* 본문 */}
            <div className="mt-3 whitespace-pre-wrap text-gray-800">
              {post.content}
            </div>

            {/* 이미지 (있을 때만) */}
            {Array.isArray(post.imageUrls) && post.imageUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {post.imageUrls.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="rounded-xl border object-cover w-full h-40"
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            {/* 해시태그 */}
            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* 액션바 */}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <button className="inline-flex items-center gap-1 hover:text-rose-600">
                <span>❤️</span>
                <span>{post.likes ?? 0}</span>
              </button>
              <button className="inline-flex items-center gap-1 hover:text-emerald-700">
                <span>💬</span>
                <span>{post.commentsCount ?? 0}</span>
              </button>
            </div>
          </article>
        ))}

        {/* 비어있을 때 */}
        {!isLoading && !error && items.length === 0 && (
          <div className="rounded-2xl border bg-white p-6 text-center text-gray-500">
            아직 게시물이 없습니다. 첫 글을 올려보세요!
          </div>
        )}
      </section>
    </main>
  );
}
