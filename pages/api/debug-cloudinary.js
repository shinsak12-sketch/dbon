// pages/api/debug-cloudinary.js
export default function handler(req, res) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || null;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || null;
  res.status(200).json({
    cloudName: cloud,
    preset,
    ok: Boolean(cloud && preset),
  });
}
