import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function PlaceDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [place, setPlace] = useState(null);
  const [password, setPassword] = useState("");

  // 1) DB에서 맛집 상세 데이터 가져오기
  useEffect(() => {
    if (id) {
      fetch(`/api/places/${id}`)
        .then((res) => res.json())
        .then((data) => setPlace(data));
    }
  }, [id]);

  // 2) 삭제 처리
  const handleDelete = async () => {
    const res = await fetch(`/api/places/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      alert("삭제 완료!");
      router.push("/"); // 삭제 후 메인으로 이동
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  if (!place) return <p>로딩 중...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{place.name}</h1>
      <p>{place.description || "소개글 없음"}</p>
      <p>작성자: {place.author || "익명"}</p>

      {/* 수정 버튼 (추후 페이지 연결 예정) */}
      <button onClick={() => router.push(`/places/edit/${id}`)}>
        ✏️ 수정하기
      </button>

      {/* 삭제 버튼 */}
      <div style={{ marginTop: "10px" }}>
        <input
          type="password"
          placeholder="비밀번호 입력"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleDelete}>🗑 삭제하기</button>
      </div>
    </div>
  );
}
