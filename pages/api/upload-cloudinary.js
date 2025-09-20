// pages/api/upload-cloudinary.js
import crypto from "crypto";

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const {
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET,
      CLOUDINARY_UPLOAD_PRESET,
    } = process.env;

    if (!CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ error: "CLOUD_NAME_MISSING" });
    }

    const { imageBase64 } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "IMAGE_REQUIRED" });
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    // dataURL이면 헤더 제거해서 순수 base64로
    const file = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");

    const folder = "dbon"; // 폴더명(원하면 변경 가능)
    const form = new URLSearchParams();

    // ✅ 1) unsigned 업로드 (preset 있으면 간단/권장)
    if (CLOUDINARY_UPLOAD_PRESET) {
      form.set("file", `data:image/*;base64,${file}`);
      form.set("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      form.set("folder", folder);
    } else {
      // ✅ 2) signed 업로드 (preset 없을 때)
      if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return res.status(500).json({ error: "CLOUDINARY_KEYS_MISSING" });
      }
      const timestamp = Math.floor(Date.now() / 1000);

      // 시그니처 생성 규칙: param들을 알파벳 순으로 결합 + API_SECRET 로 sha1
      // 여기서는 필수인 timestamp와 선택 folder만 서명에 포함
      const toSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
      const signature = crypto.createHash("sha1").update(toSign).digest("hex");

      form.set("file", `data:image/*;base64,${file}`);
      form.set("api_key", CLOUDINARY_API_KEY);
      form.set("timestamp", String(timestamp));
      form.set("signature", signature);
      form.set("folder", folder);
    }

    const r = await fetch(endpoint, {
      method: "POST",
      body: form,
    });

    const data = await r.json();
    if (!r.ok || !data?.secure_url) {
      console.error("CLOUDINARY UPLOAD ERROR:", r.status, data);
      return res.status(502).json({ error: "UPLOAD_FAILED" });
    }

    return res.status(200).json({ url: data.secure_url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
