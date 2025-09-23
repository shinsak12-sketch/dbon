// pages/places/success.js
import Link from "next/link";
import { useRouter } from "next/router";

export default function Success() {
  const { query } = useRouter();
  const place = String(query.place || "");
  const region = String(query.region || "");

  // 안전장치: 쿼리 누락 시 홈/목록으로
  const detailHref = region && place ? `/places/${region}/${place}` : "/";
  const regionHref = region ? `/places/${region}` : "/`;

  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <div className="text-3xl font-extrabold text-emerald-700">🎉 등록 완료!</div>
      <p className="mt-3 text-gray-600">
        새로운 맛집이 성공적으로 등록되었습니다. 이제 다른 사람들도 함께 즐길 수 있어요 😉
      </p>

      <div className="mt-8 space-y-3">
        <Link
          href={detailHref}
          className="block w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800"
        >
          내 등록한 맛집 보기
        </Link>
        <Link
          href={regionHref}
          className="block w-full rounded-xl border px-4 py-3 font-semibold hover:bg-gray-50"
        >
          지역 목록으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
