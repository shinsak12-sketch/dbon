import fs from "fs";
import path from "path";
import mime from "mime";
import { getBaseDir, safeName } from "./lib";

export default function handler(req, res) {
  const name = safeName(req.query.name || "");
  if (!name) return res.status(400).send("Bad Request");

  const { uploads } = getBaseDir();
  const filePath = path.join(uploads, name);
  if (!fs.existsSync(filePath)) return res.status(404).send("Not Found");

  const type = mime.getType(filePath) || "application/octet-stream";
  res.setHeader("Content-Type", type);
  fs.createReadStream(filePath).pipe(res);
}
