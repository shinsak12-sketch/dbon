// pages/api/stagram/feed.js
import { listPosts } from "../../../lib/stagramStore";

export default function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }

    const items = listPosts();
    return res.status(200).json({ ok: true, items });
  } catch (e) {
    console.error("stagram/feed error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
