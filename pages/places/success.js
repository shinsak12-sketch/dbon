// pages/places/success.js
import Link from "next/link";
import { useRouter } from "next/router";

export default function Success() {
  const { query } = useRouter();
  // new.js에서 ?slug=<placeSlug> 로 넘겨줌
  const placeSlug = typeof query.slug === "string" ? query.slug : "";

  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <span className="text-2xl">🎉</span>
      </div>

      <h1 className="text-2xl font-extrabold text-emerald-700">😋 등록 성공!</h1>
      <p className="mt-3 text-gray-700">
        이제 모두가 당신의 찐맛집을 알게 될 거예요.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {/* 목록으로 (지역 선택 화면) */}
        <Link
          href="/regions"
          className="inline-block w-full rounded-xl bg-emerald-700 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-800"
        >
          배고파졌다면 목록으로 Go!
        </Link>

        {/* 내가 올린 집 보러가기: placeSlug가 있을 때만 노출 */}
        {placeSlug && (
          <Link
            href={`/places/${placeSlug}`}
            className="inline-block w-full rounded-xl border px-5 py-3 text-center font-semibold hover:bg-gray-50"
          >
            내가 올린 집 보러가기
          </Link>
        )}
      </div>

      <p className="mt-5 text-xs text-gray-500">
        맛집 제보 감사! 다음 끼니는 제가 책임질게요 🤝
      </p>
    </main>
  );
}
