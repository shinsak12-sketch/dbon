export default async function handler(req, res) {
  try {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    if (!cloud || !preset) {
      return res.status(500).json({ ok: false, reason: "env missing" });
    }

    // 1x1 transparent PNG
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B1mC2ySAAAAAASUVORK5CYII=";

    const fd = new FormData();
    fd.append("file", dataUrl);
    fd.append("upload_preset", preset);

    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: "POST",
      body: fd,
    });
    const json = await r.json();
    return res.status(r.ok ? 200 : 500).json(json);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
