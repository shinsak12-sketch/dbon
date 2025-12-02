import fs from "fs";
import path from "path";
import os from "os";

export function getBaseDir() {
  const base = process.env.UPLOAD_DIR || path.join(os.tmpdir(), "dbon-stagram");
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  const up = path.join(base, "uploads");
  if (!fs.existsSync(up)) fs.mkdirSync(up, { recursive: true });
  return { base, uploads: up };
}

const POSTS_JSON = "posts.json";

export function loadPosts() {
  const { base } = getBaseDir();
  const file = path.join(base, POSTS_JSON);
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function savePosts(list) {
  const { base } = getBaseDir();
  const file = path.join(base, POSTS_JSON);
  fs.writeFileSync(file, JSON.stringify(list, null, 2), "utf8");
}

export function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function safeName(name = "") {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}
