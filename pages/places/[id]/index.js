const handleDelete = async () => {
  const pw = prompt("삭제하려면 비밀번호를 입력하세요");
  if (!pw) return;

  const res = await fetch(`/api/places/${place.id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerPass: pw }),
  });

  if (res.ok) {
    alert("삭제 완료!");
    router.push("/regions"); // 지역 선택 화면으로
  } else {
    const err = await res.json();
    alert(err.error);
  }
};
