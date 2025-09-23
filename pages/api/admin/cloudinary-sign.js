// pages/api/admin/cloudinary-sign.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }

    // 필수 env 점검
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        error: "MISSING_ENV",
        detail: {
          CLOUDINARY_CLOUD_NAME: !!CLOUDINARY_CLOUD_NAME,
          CLOUDINARY_API_KEY: !!CLOUDINARY_API_KEY,
          CLOUDINARY_API_SECRET: !!CLOUDINARY_API_SECRET
        }
      });
    }

    // 덮어쓰기 고정 ID
    const public_id = "landing/hero";
    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign = {
      public_id,
      overwrite: true,
      invalidate: true,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      public_id,
      signature,
    });
  } catch (e) {
    console.error("[cloudinary-sign] error:", e);
    return res.status(500).json({ error: "SERVER_ERROR", detail: String(e?.message || e) });
  }
}
