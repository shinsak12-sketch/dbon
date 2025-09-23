// pages/api/admin/background.js
import prisma from "../../../lib/prisma";

const ADMIN_PASSWORD = "dbsonsa"; // 요청대로 고정 비번

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // 저장된 배경 URL 조회
      const row = await prisma.setting.findUnique({ where: { key: "heroUrl" } });
      return res.status(200).json({ url: row?.value || "" });
    }

    if (req.method === "POST") {
      const { password, url } = req.body || {};
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "INVALID_PASSWORD" });
      }
      if (!url || !/^https?:\/\//.test(String(url))) {
        return res.status(400).json({ error: "INVALID_URL" });
      }

      await prisma.setting.upsert({
        where: { key: "heroUrl" },
        update: { value: String(url) },
        create: { key: "heroUrl", value: String(url) },
      });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    console.error("admin/background error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
