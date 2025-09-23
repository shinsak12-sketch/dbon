// pages/api/admin/background.js
import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";

export const config = { api: { bodyParser: false } };

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const form = formidable({
      multiples: false,
      maxFileSize: 15 * 1024 * 1024, // 15MB
      filter: ({ mimetype }) => (mimetype || "").startsWith("image/"),
    });

    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(400).json({ error: "UPLOAD_PARSE_ERROR" });
      const f = files.file;
      if (!f) return res.status(400).json({ error: "FILE_REQUIRED" });

      const filepath = Array.isArray(f) ? f[0].filepath : f.filepath;

      try {
        const result = await cloudinary.uploader.upload(filepath, {
          public_id: "site/background",
          resource_type: "image",
          overwrite: true,
          invalidate: true,
          unique_filename: false,
          // 원본 비율 유지, 너무 큰 경우 자동 리사이즈 옵션을 쓰고 싶다면 아래 예시처럼:
          // transformation: [{ width: 2560, height: 1440, crop: "limit" }],
        });

        return res.status(200).json({
          ok: true,
          secure_url: result.secure_url, // 버전이 포함된 최신 URL
          public_id: result.public_id,
          version: result.version,
        });
      } catch (e) {
        console.error("Cloudinary upload error:", e);
        return res.status(500).json({ error: "CLOUDINARY_UPLOAD_FAILED" });
      }
    });
  } catch (e) {
    console.error("Server error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
