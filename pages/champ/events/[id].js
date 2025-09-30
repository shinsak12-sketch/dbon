import useSWR from "swr";
const fetcher = (url) => fetch(url).then(r=>r.json());

export default function EventDetail({ id }) {
  const { data } = useSWR(`/api/champ/events/${id}`, fetcher);
  const ev = data?.event;
  const rows = data?.results || [];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{ev ? ev.title : "대회"}</h1>
      {ev && <p className="text-sm text-gray-500">{ev.date?.slice(0,10)} · {ev.course}</p>}
      <div className="mt-4 rounded-2xl border bg-white p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>순위</th><th>이름</th><th>닉네임</th><th>Gross</th><th>Net</th></tr></thead>
          <tbody>
            {rows.map((r, i)=>(
              <tr key={r.participantId} className="border-t">
                <td className="py-2">{i+1}</td>
                <td>{r.name}</td>
                <td className="text-gray-500">{r.nickname}</td>
                <td>{r.gross ?? "-"}</td>
                <td>{r.net ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
export async function getServerSideProps({ params }) { return { props: { id: params.id } }; }
