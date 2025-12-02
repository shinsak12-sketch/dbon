import formidable from "formidable";
import fs from "fs";
import path from "path";
import { getBaseDir, loadPosts, savePosts, genId, safeName } from "./lib";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // 단건 조회: GET /api/stagram/posts?id=xxx
  if (req.method === "GET") {
    const id = String(req.query.id || "");
    const list = loadPosts();
    const post = list.find((p) => p.id === id);
    if (!post) return res.status(404).json({ ok: false, message: "NOT_FOUND" });
    return res.status(200).json({ ok: true, item: post });
  }

  // 생성: POST multipart/form-data
  if (req.method === "POST") {
    try {
      const { uploads } = getBaseDir();

      const form = formidable({
        multiples: true,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
      });

      const { fields, files } = await new Promise((resolve, reject) =>
        form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })))
      );

      const title = String(fields.title || "").trim();
      const content = String(fields.content || "").trim();
      const tags = String(fields.tags || "")
        .split(/[,\s]+/)
        .filter(Boolean)
        .slice(0, 10);

      if (!title || !content) {
        return res.status(400).json({ ok: false, message: "MISSING_FIELDS" });
      }

      const raw = files?.images
        ? Array.isArray(files.images)
          ? files.images
          : [files.images]
        : [];
      const files5 = raw.slice(0, 5);

      const imageNames = [];
      for (const f of files5) {
        const orig = safeName(f.originalFilename || f.newFilename || "image");
        const ext = path.extname(orig) || ".jpg";
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
        const dest = path.join(uploads, filename);
        fs.copyFileSync(f.filepath, dest);
        imageNames.push(filename);
      }

      const post = {
        id: genId(),
        author: fields.author ? String(fields.author) : "익명",
        dept: fields.dept ? String(fields.dept) : null,
        title,
        content,
        tags,
        images: imageNames,
        likes: 0,
        comments: 0,
        createdAt: Date.now(),
      };

      const list = loadPosts();
      list.push(post);
      savePosts(list);

      return res.status(200).json({ ok: true, item: post });
    } catch (e) {
      console.error("stagram/posts POST error:", e);
      return res.status(500).json({ ok: false, message: e.message || "SERVER_ERROR" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, message: "METHOD_NOT_ALLOWED" });
}
