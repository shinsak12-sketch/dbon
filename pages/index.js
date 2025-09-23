// pages/index.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getServerSideProps() {
  try {
    // public_id로 최신 리소스 조회 (버전 포함 URL 확보)
    const r = await cloudinary.api.resource("site/background", {
      resource_type: "image",
      type: "upload",
    });
    return { props: { bgUrl: r.secure_url || "" } };
  } catch {
    // 아직 업로드 안했으면 기본(null)
    return { props: { bgUrl: "" } };
  }
}

export default function Home({ bgUrl }) {
  const hasImage = !!bgUrl;

  return (
    <main
      className={`h-screen flex items-center justify-center text-white`}
      style={
        hasImage
          ? {
              backgroundImage: `url('${bgUrl}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      {!hasImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-800" />
      )}
      <h1 className="relative text-4xl font-extrabold drop-shadow">
        DB슐랭 맛집
      </h1>
    </main>
  );
      }
