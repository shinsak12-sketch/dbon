// pages/api/stagram/posts.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { authorName, authorDept, content, imageUrls } = req.body || {};

      const hasContent = typeof content === "string" && content.trim() !== "";
      const imgs = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];

      if (!hasContent && imgs.length === 0) {
        return res
          .status(400)
          .json({ error: "CONTENT_OR_IMAGE_REQUIRED" });
      }

      const post = await prisma.stagramPost.create({
        data: {
          authorName: hasContent
            ? (authorName || null)
            : (authorName || null), // 어차피 선택
          authorDept: authorDept || null,
          content: content || null,
          imageUrls: imgs,
          // likes / commentsCount 는 기본값 0
        },
      });

      return res.status(200).json({ ok: true, post });
    }

    if (req.method === "GET") {
      const { id } = req.query;

      // ?id= 로 단일 조회 지원 (필요 없으면 이 블럭 빼도 됨)
      if (id) {
        const pid = Number(id);
        if (!pid) {
          return res.status(400).json({ error: "INVALID_ID" });
        }
        const post = await prisma.stagramPost.findUnique({
          where: { id: pid },
        });
        if (!post) {
          return res.status(404).json({ error: "NOT_FOUND" });
        }
        return res.status(200).json({ ok: true, post });
      }

      // id 없으면 전체 목록 (관리/디버그용)
      const items = await prisma.stagramPost.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return res.status(200).json({ ok: true, items });
    }

    res.setHeader("Allow", "GET,POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("stagram/posts error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
