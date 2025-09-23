// pages/api/admin/hero.js
import prisma from "../../../lib/prisma";

const ADMIN_PASSWORD = "dbsonsa";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const s = await prisma.setting.findUnique({ where: { key: "heroImageUrl" } });
      return res.status(200).json({ value: s?.value || "" });
    }

    if (req.method === "POST") {
      const { password, imageUrl } = req.body || {};
      if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "UNAUTHORIZED" });
      if (!imageUrl || !String(imageUrl).trim())
        return res.status(400).json({ error: "IMAGE_URL_REQUIRED" });

      await prisma.setting.upsert({
        where: { key: "heroImageUrl" },
        update: { value: String(imageUrl).trim() },
        create: { key: "heroImageUrl", value: String(imageUrl).trim() },
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
