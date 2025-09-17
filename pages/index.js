import Link from "next/link";

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(#ffffff, #f3f4f6)",
      padding: "24px",
      textAlign: "center"
    }}>
      <div>
        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>디비슐랭</h1>
        <p style={{ marginTop: 12, color: "#4b5563" }}>전국의 진짜 맛, 현장이 증명합니다.</p>
        <Link href="/regions" style={{
          display: "inline-block",
          marginTop: 24,
          padding: "12px 28px",
          borderRadius: 12,
          background: "#0f7b4d",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 6px 16px rgba(0,0,0,0.15)"
        }}>
          START
        </Link>
      </div>
    </main>
  );
}
