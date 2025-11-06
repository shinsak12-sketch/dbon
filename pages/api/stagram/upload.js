// pages/api/stagram/upload.js

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }

    const body = req.body || {};
    const images = Array.isArray(body.images) ? body.images : [];

    if (!images.length) {
      return res.status(400).json({ error: "NO_IMAGES" });
    }

    // TODO: 여기서 실제 스토리지(S3 등)에 업로드하고, 공개 URL 배열을 반환하면 됨.
    // 현재는 클라이언트에서 보낸 base64 dataURL 그대로 반환 (데모/임시용)
    return res.status(200).json({ ok: true, urls: images });
  } catch (e) {
    console.error("stagram/upload error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
