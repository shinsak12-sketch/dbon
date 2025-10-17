// pages/champ/notice/index.js
import useSWR from "swr";
import Link from "next/link";

const fetcher = (u) => fetch(u).then((r) => r.json());

export default function NoticeList() {
  const { data, error, isLoading } = useSWR("/api/champ/home", fetcher, { revalidateOnFocus: false });
  const notices = data?.notices || [];

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-emerald-800">공지사항</h1>
        <Link href="/champ" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          ← 챔피언십 홈
        </Link>
      </header>

      {isLoading && <div className="rounded-2xl border bg-white p-6">불러오는 중…</div>}
      {error && <div className="rounded-2xl border bg-white p-6 text-rose-600">불러오기 실패</div>}

      <section className="rounded-2xl border bg-white">
        {notices.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">공지사항이 없습니다.</div>
        ) : (
          <ul className="divide-y">
            {notices.map((n) => (
              <li key={n.id} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{n.title}</div>
                  {n.createdAt && (
                    <div className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleString("ko-KR")}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{n.content}</div>
                {n.pinned && <div className="mt-2 inline-block text-xs text-emerald-700 border border-emerald-200 rounded px-2 py-0.5">상단 고정</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
