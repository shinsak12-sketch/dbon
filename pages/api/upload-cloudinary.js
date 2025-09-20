// pages/api/upload-cloudinary.js
export const config = {
  api: {
    bodyParser: false, // FormData 받기 위해 false
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    const preset = process.env.CLOUDINARY_PRESET;
    if (!cloud || !preset) {
      return res.status(500).json({ error: "Cloudinary 환경변수 누락" });
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: "POST",
      headers: {
        ...req.headers,
      },
      body: req, // 스트림 그대로 전달
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "업로드 실패" });
  }
}
