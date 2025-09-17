export default function RegionBoard({ query }) {
  // Next 14 pages router에선 getInitialProps 없이도 query는 없어도 OK.
  // 간단히 URL에서 지역명만 표시:
  const slug = typeof window !== "undefined"
    ? window.location.pathname.split("/").pop()
    : "";

  const DUMMY_LIST = [
    { id: 1, name: "을지로 냉면집", rating: 4.7, tags: ["냉면","노포"], saves: 120, comments: 45 },
    { id: 2, name: "망원동 라멘", rating: 4.5, tags: ["라멘"], saves: 98, comments: 31 },
    { id: 3, name: "연남 파스타", rating: 4.3, tags: ["파스타","데이트"], saves: 76, comments: 22 },
  ];

  return (
    <main style={{maxWidth: 800, margin: "0 auto", padding: 24}}>
      <h1 style={{fontSize: 24, fontWeight: 800}}>
        {slug?.toUpperCase()} 지역 맛집
      </h1>

      <div style={{display:"flex", gap:8, marginTop:16, flexWrap:"wrap"}}>
        <button style={btn}>카테고리</button>
        <button style={btn}>정렬: 최신</button>
        <button style={btn}>검색</button>
      </div>

      <div style={{marginTop:24, display:"grid", gap:12}}>
        {DUMMY_LIST.map(item => (
          <div key={item.id} style={{
            padding:16, background:"#fff", border:"1px solid #e5e7eb",
            borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,0.05)"
          }}>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <div style={{fontWeight:600}}>{item.name}</div>
              <div style={{fontSize:12}}>★ {item.rating.toFixed(1)}</div>
            </div>
            <div style={{fontSize:13, color:"#6b7280", marginTop:4}}>
              #{item.tags.join(" #")}
            </div>
            <div style={{fontSize:12, color:"#9ca3af", marginTop:4}}>
              저장 {item.saves} · 댓글 {item.comments}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const btn = {
  padding: "6px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  background: "#fff"
};
