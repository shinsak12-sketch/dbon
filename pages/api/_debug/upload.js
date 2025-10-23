// pages/api/_debug/upload.js
import formidable from "formidable";
import * as XLSX from "xlsx";
import os from "os";
import path from "path";
import fs from "fs";

export const config = {
  api: { bodyParser: false, sizeLimit: "20mb" }, // multipart
};

// 안전한 임시 디렉토리 보장
function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
}

function pickFirstFile(files) {
  if (!files) return null;
  // 흔한 키 우선
  const keys = ["file", "excel", "upload", "scores"];
  for (const k of keys) {
    const v = files[k];
    if (v) return Array.isArray(v) ? v[0] : v;
  }
  // 아무거나 첫 번째
  const any = Object.values(files)[0];
  return Array.isArray(any) ? any[0] : any || null;
}

function filePathOf(f) {
  return f?.filepath || f?.path || f?.tempFilePath || f?.file?.filepath || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const now = new Date().toISOString();
  const uploadDir = path.join(os.tmpdir(), "dbon-debug-uploads");
  ensureDir(uploadDir);

  try {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      allowEmptyFiles: false,
      uploadDir,
      maxFileSize: 20 * 1024 * 1024,
    });

    const { fields, files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })))
    );

    const picked = pickFirstFile(files);
    const filepath = filePathOf(picked);

    // 1) 단계: 파일 수신 결과
    const stage1 = {
      ok: true,
      stage: "parsed",
      time: now,
      request: {
        method: req.method,
        query: req.query,
        headers: {
          "content-type": req.headers["content-type"],
          "x-admin": req.headers["x-admin"] || null,
        },
      },
      fields,
      fileKeys: Object.keys(files || {}),
      pickedMeta: picked
        ? {
            size: picked.size,
            mimetype: picked.mimetype || picked.type,
            originalFilename: picked.originalFilename || picked.name,
            filepath,
          }
        : null,
    };

    if (!filepath) {
      return res.status(200).json({ ...stage1, ok: false, note: "No filepath detected (브라우저 전송 문제 가능)" });
    }

    // 2) 단계: 엑셀 파싱 결과
    let wb;
    try {
      wb = XLSX.readFile(filepath, { cellDates: true });
    } catch (e) {
      return res.status(200).json({
        ...stage1,
        ok: false,
        stage: "readFile",
        error: "INVALID_FILE_FORMAT",
        message: e.message,
      });
    }

    // 시트별 행 수
    const sheets = wb.SheetNames.map((name) => {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "", raw: true });
      return { name, rows: rows.length };
    });

    // 데이터 있는 첫 시트 샘플
    let chosenName = null;
    let sampleIn = [];
    for (const { name } of sheets) {
      const s = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(s, { defval: "", raw: true });
      if (rows.length) {
        chosenName = name;
        sampleIn = rows.slice(0, 5);
        break;
      }
    }

    return res.status(200).json({
      ...stage1,
      ok: true,
      stage: "sheet",
      sheets,
      chosenSheet: chosenName,
      sampleRows: sampleIn, // 업로드된 표의 앞 5줄을 그대로 보여줌
    });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      stage: "catch",
      time: now,
      error: "SERVER_ERROR",
      message: e.message,
    });
  }
}
