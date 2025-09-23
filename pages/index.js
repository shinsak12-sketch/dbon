// pages/index.js
import Link from "next/link";

const cloudUrl = (() => {
  // 공개 키만 쓰는 프론트 전용 env (없으면 그냥 빈 문자열)
  const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  if (!name) return "";
  // 덮어쓰는 public_id: landing/hero  (f_auto,q_auto로 포맷/용량 최적화)
  return `https://res.cloudinary.com/${name}/image/upload/f_auto,q_auto/landing/hero`;
})();

export default function Home() {
  // 배경: 그라데이션 위에 이미지(url이 있을 때만) 겹쳐서 지정
  // 이미지가 없거나 404여도 그라데이션은 그대로 보임
  const bgStyle = cloudUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(5,150,105,1), rgba(4,120,87,1) 60%, rgba(13,148,136,1)), url("${cloudUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {
        backgroundImage:
          "linear-gradient(135deg, rgba(5,150,105,1), rgba(4,120,87,1) 60%, rgba(13,148,136,1))",
      };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-white text-center px-6"
      style={bgStyle}
    >
      <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg">
        디비슐랭
      </h1>
      <p className="mt-6 text-lg md:text-xl text-emerald-100">
        전국의 진짜 맛, 현장이 증명합니다.
      </p>
      <Link
        href="/regions"
        className="inline-block mt-10 px-10 py-4 rounded-2xl bg-white text-emerald-700 font-bold shadow-xl hover:bg-emerald-50 hover:scale-105 transition transform"
      >
        START
      </Link>
    </main>
  );
}
