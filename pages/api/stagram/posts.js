// pages/api/stagram/posts.js
import { addPost, listPosts } from "../../../lib/stagramStore";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { authorName, authorDept, content, imageUrls } = req.body || {};

      if (!content && (!imageUrls || imageUrls.length === 0)) {
        return res
          .status(400)
          .json({ error: "CONTENT_OR_IMAGE_REQUIRED" });
      }

      const post = addPost({
        authorName,
        authorDept,
        content,
        imageUrls,
      });

      return res.status(200).json({ ok: true, post });
    }

    if (req.method === "GET") {
      // 필요하면 단일 포스트 조회 or 전체 목록 반환
      const items = listPosts();
      return res.status(200).json({ ok: true, items });
    }

    res.setHeader("Allow", "GET,POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("stagram/posts error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
