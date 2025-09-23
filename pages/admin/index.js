// pages/index.js
import Link from "next/link";
import prisma from "../lib/prisma";
import { useState } from "react";

export async function getServerSideProps() {
  // Setting 테이블에 저장된 heroUrl 사용 (없으면 null)
  // 예: 관리자 화면에서 업로드 후 /api/admin/hero-url 로 저장한 값
  let heroUrl = null;
  try {
    const setting = await prisma.setting.findFirst({
      select: { heroUrl: true },
    });
    heroUrl = setting?.heroUrl || null;
  } catch (_) {
    heroUrl = null;
  }
  return { props: { heroUrl } };
}

export default function Home({ heroUrl }) {
  // 이미지 에러 시 자동 숨김
  const [showImg, setShowImg] = useState(Boolean(heroUrl));

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white text-center px-6">
      {/* 제목 위에 작은 이미지(선택) */}
      {showImg && heroUrl ? (
        <img
          src={heroUrl}
          alt="디비슐랭"
          className="w-28 h-28 md:w-32 md:h-32 object-contain mb-4 rounded-xl shadow-xl"
          onError={() => setShowImg(false)}
        />
      ) : null}

      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg">
        디비슐랭
      </h1>

      <p className="mt-4 text-lg md:text-xl text-emerald-100">
        전국의 진짜 맛, 현장이 증명합니다.
      </p>

      <Link
        href="/regions"
        className="inline-block mt-8 px-10 py-4 rounded-2xl bg-white text-emerald-700 font-bold shadow-xl hover:bg-emerald-50 hover:scale-105 transition transform"
      >
        START
      </Link>
    </main>
  );
}
