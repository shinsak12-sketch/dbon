// pages/api/stagram/comments.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // 댓글 목록 조회
      const postId = Number(req.query.postId);
      if (!postId) {
        return res.status(400).json({ ok: false, error: "INVALID_POST_ID" });
      }

      const comments = await prisma.stagramComment.findMany({
        where: { postId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          authorName: true,
          content: true,
          createdAt: true,
        },
      });

      return res.status(200).json({ ok: true, comments });
    }

    if (req.method === "POST") {
      // 댓글 작성
      const { postId, authorName, content } = req.body;
      const id = Number(postId);
      if (!id || !content?.trim()) {
        return res.status(400).json({ ok: false, error: "INVALID_INPUT" });
      }

      const result = await prisma.$transaction(async (tx) => {
        const comment = await tx.stagramComment.create({
          data: {
            postId: id,
            authorName: authorName?.trim() || null,
            content: content.trim(),
          },
          select: {
            id: true,
            authorName: true,
            content: true,
            createdAt: true,
            postId: true,
          },
        });

        await tx.stagramPost.update({
          where: { id },
          data: { commentsCount: { increment: 1 } },
        });

        return comment;
      });

      return res.status(200).json({ ok: true, comment: result });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("stagram comments error:", e);
    return res
      .status(500)
      .json({ ok: false, error: "SERVER_ERROR", message: e.message });
  }
}
