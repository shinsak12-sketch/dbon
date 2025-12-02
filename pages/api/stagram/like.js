// pages/api/stagram/like.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const { postId } = req.body;
    const id = Number(postId);
    if (!id) {
      return res.status(400).json({ ok: false, error: "INVALID_POST_ID" });
    }

    const post = await prisma.stagramPost.update({
      where: { id },
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true },
    });

    return res.status(200).json({ ok: true, post });
  } catch (e) {
    console.error("stagram like error:", e);
    return res
      .status(500)
      .json({ ok: false, error: "SERVER_ERROR", message: e.message });
  }
}
