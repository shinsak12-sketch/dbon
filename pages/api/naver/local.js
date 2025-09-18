// pages/api/naver/local.js
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.status(400).json({ error: "q required" });

  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
    q
  )}&display=7&start=1&sort=random`;

  try {
    const r = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
      },
      cache: "no-store",
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    // 필요한 필드만 깔끔히 반환
    const items =
      (data.items || []).map((it) => ({
        title: it.title?.replace(/<[^>]*>/g, "") || "",
        category: it.category || "",
        address: it.address || "", // 지번
        roadAddress: it.roadAddress || "", // 도로명
        telephone: it.telephone || "",
        link: it.link || "", // 네이버 플레이스 링크(있을 수 있음)
        mapx: it.mapx || "", // TM128 좌표 (문자열)
        mapy: it.mapy || "",
      })) ?? [];
    res.status(200).json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "naver fetch failed" });
  }
}
