// pages/api/upload.js
export const config = {
  api: {
    bodyParser: false, // 파일 스트림 받기 위해
  },
};

import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;

  if (!cloud || !preset) {
    return res.status(500).json({ error: "Cloudinary 환경변수 누락" });
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: "파일 파싱 실패" });
    const file = files.file;

    try {
      const data = fs.readFileSync(file.filepath);
      const formData = new FormData();
      formData.append("file", new Blob([data]), file.originalFilename);
      formData.append("upload_preset", preset);

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
        { method: "POST", body: formData }
      );
      const result = await cloudRes.json();

      if (result.secure_url) {
        return res.status(200).json({ url: result.secure_url });
      } else {
        return res.status(500).json({ error: "업로드 실패", detail: result });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "업로드 오류" });
    }
  });
}
