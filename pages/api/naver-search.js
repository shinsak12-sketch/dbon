// pages/api/naver-search.js
export default async function handler(req, res) {
  const { query } = req.query;
  if (!query || !String(query).trim()) {
    return res.status(400).json({ error: "QUERY_REQUIRED" });
  }

  try {
    const r = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
        query
      )}&display=7&sort=random`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID || "",
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET || "",
        },
      }
    );

    if (!r.ok) {
      const t = await r.text();
      console.error("NAVER API ERROR:", r.status, t);
      return res.status(502).json({ error: "NAVER_API_ERROR" });
    }

    const data = await r.json();
    return res.status(200).json(Array.isArray(data.items) ? data.items : []);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
}
