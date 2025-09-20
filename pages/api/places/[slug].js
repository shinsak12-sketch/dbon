// pages/api/places/[slug].js
import prisma from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { slug } = req.query;

  try {
    if (req.method === "GET") {
      const place = await prisma.place.findUnique({ where: { slug } });
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });
      return res.json(place);
    }

    if (req.method === "PUT") {
      const {
        name,
        description,
        author,
        address,
        mapUrl,
        coverImage,
        password,
      } = req.body || {};

      const place = await prisma.place.findUnique({ where: { slug } });
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });

      if (place.ownerPassHash) {
        if (!password) return res.status(400).json({ error: "PASSWORD_REQUIRED" });
        const ok = await bcrypt.compare(password, place.ownerPassHash);
        if (!ok) return res.status(403).json({ error: "INVALID_PASSWORD" });
      }

      const updated = await prisma.place.update({
        where: { slug },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(author !== undefined ? { author } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(mapUrl !== undefined ? { mapUrl } : {}),
          ...(coverImage !== undefined ? { coverImage } : {}),
        },
      });
      return res.json(updated);
    }

    if (req.method === "DELETE") {
      const { password } = req.body || {};
      const place = await prisma.place.findUnique({ where: { slug } });
      if (!place) return res.status(404).json({ error: "NOT_FOUND" });

      if (place.ownerPassHash) {
        if (!password) return res.status(400).json({ error: "PASSWORD_REQUIRED" });
        const ok = await bcrypt.compare(password, place.ownerPassHash);
        if (!ok) return res.status(403).json({ error: "INVALID_PASSWORD" });
      }

      await prisma.review.deleteMany({ where: { placeId: place.id } });
      await prisma.place.delete({ where: { slug } });
      return res.json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server Error" });
  }
}
