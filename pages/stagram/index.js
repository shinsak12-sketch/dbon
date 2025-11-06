// pages/stagram/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url) => fetch(url).then((r) => r.json());

function timeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR");
}

export default function StagramHome() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/stagram/feed",
    fetcher,
    { revalidateOnFocus: false }
  );

  const items = data?.items || [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* 상단 타이틀 + 글쓰기 버튼 */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
              DB ON Stagram
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              사내 일상과 소식을 함께 나누는 디비온스타그램
            </p>
          </div>
          <Link
            href="/stagram/new"
            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            ✚ 글쓰기
          </Link>
        </div>

        {/* 상태 */}
        {isLoading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-600">
            피드를 불러오는 중…
          </div>
        )}
        {error && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-rose-600">
            피드를 불러오지 못했습니다.
          </div>
        )}

        {/* 피드 리스트 */}
        <div className="space-y-4 sm:space-y-5 pb-16">
          {items.length === 0 && !isLoading && !error && (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 text-center">
              아직 올라온 게시글이 없습니다.
              <br />
              첫 번째 디비온스타그램을 올려보세요 ✨
            </div>
          )}

          {items.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border bg-white shadow-sm overflow-hidden"
            >
              {/* 상단 프로필 줄 */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
                    {post.authorName?.[0] || "😀"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {post.authorName || "익명"}
                      {post.authorDept && (
                        <span className="ml-1 text-xs text-gray-500">
                          ({post.authorDept})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {timeAgo(post.createdAt)}
                    </div>
                  </div>
                </div>
                <span className="text-gray-400 text-lg">⋯</span>
              </div>

              {/* 이미지 영역 */}
              {Array.isArray(post.imageUrls) && post.imageUrls.length > 0 && (
                <div className="bg-black/5">
                  <div className="relative w-full aspect-[4/5] sm:aspect-video overflow-hidden">
                    <img
                      src={post.imageUrls[0]}
                      alt="post"
                      className="h-full w-full object-cover"
                    />
                    {post.imageUrls.length > 1 && (
                      <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                        +{post.imageUrls.length - 1}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 본문 + 액션 */}
              <div className="px-4 py-3 space-y-2">
                {post.content && (
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}
                <div className="text-xs text-gray-500 flex items-center gap-4">
                  <span>❤️ {post.likes ?? 0}</span>
                  <span>💬 {post.commentsCount ?? 0}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
