// pages/api/stagram/feed.js
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }

    // 최신순 피드 (원하면 take 조절)
    const items = await prisma.stagramPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.status(200).json({ ok: true, items });
  } catch (e) {
    console.error("stagram/feed error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
