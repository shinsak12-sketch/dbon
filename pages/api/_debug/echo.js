export const config = { api: { bodyParser: true } }; // Next API 기본 파서 사용

export default async function handler(req, res) {
  res.status(200).json({
    method: req.method,
    headers: req.headers,
    query: req.query,
    // Next는 JSON/URL-Encoded면 자동 파싱됨
    body: req.body ?? null,
    note: "headers['content-type']가 application/json 인지 꼭 확인",
  });
}
