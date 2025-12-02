import { loadPosts } from "./lib";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, message: "METHOD_NOT_ALLOWED" });
  }

  const page = Math.max(1, Number(req.query.page || 1));
  const size = Math.min(50, Math.max(1, Number(req.query.size || 10)));

  const all = loadPosts().sort((a, b) => b.createdAt - a.createdAt);
  const start = (page - 1) * size;
  const items = all.slice(start, start + size);

  return res.status(200).json({
    ok: true,
    page,
    size,
    total: all.length,
    items,
  });
}
