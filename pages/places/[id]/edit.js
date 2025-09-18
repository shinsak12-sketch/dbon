import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function EditPlace() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm] = useState(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (id) {
      fetch(`/api/places/${id}`)
        .then((res) => res.json())
        .then((data) => setForm(data));
    }
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/places/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ownerPass: password }),
    });

    if (res.ok) {
      alert("수정 완료!");
      router.push(`/places/${id}`);
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  if (!form) return <p>로딩중...</p>;

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">맛집 수정</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={form.name} onChange={handleChange} className="w-full border p-2" />
        <textarea name="description" value={form.description || ""} onChange={handleChange} className="w-full border p-2" />
        <input type="password" placeholder="비밀번호 입력" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">수정하기</button>
      </form>
    </div>
  );
}
