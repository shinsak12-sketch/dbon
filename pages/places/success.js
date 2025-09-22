// pages/places/success.js
import Link from "next/link";

export default function SuccessPage({ query }) {
  const slug = query?.slug || "";

  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-3xl font-extrabold text-emerald-700 mb-4">
        🎉 등록 완료!
      </h1>
      <p className="text-gray-700 mb-6">
        새로운 맛집이 성공적으로 등록되었습니다.
        <br />
        이제 다른 사람들도 함께 즐길 수 있어요 😋
      </p>

      <div className="space-y-3">
        {slug && (
          <Link
            href={`/places/${slug}`}
            className="block rounded-xl bg-emerald-700 text-white px-6 py-3 font-semibold hover:bg-emerald-800"
          >
            내 등록한 맛집 보기
          </Link>
        )}
        <Link
          href="/regions"
          className="block rounded-xl border px-6 py-3 font-semibold hover:bg-gray-50"
        >
          지역 목록으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

// ✅ query를 받기 위해 getServerSideProps 추가
export async function getServerSideProps({ query }) {
  return { props: { query } };
}
