import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventStats } from "@/lib/stats";

function pnlColor(v: number) {
  if (v > 0) return "text-green-400";
  if (v < 0) return "text-red-400";
  return "text-gray-400";
}

function fmt(v: number) {
  return (v >= 0 ? "+" : "") + v.toFixed(2);
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEventStats(Number(id));
  if (!result) notFound();

  const { event, totalSessions, playerStats } = result;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{event.name}</h1>
        {event.description && <p className="text-gray-400 mt-1">{event.description}</p>}
        {(event.startDate || event.endDate) && (
          <p className="text-gray-500 text-sm mt-1">
            {event.startDate ? new Date(event.startDate).toISOString().split("T")[0] : ""}
            {event.endDate ? ` → ${new Date(event.endDate).toISOString().split("T")[0]}` : ""}
          </p>
        )}
        <p className="text-gray-400 text-sm mt-2">{totalSessions} sessions</p>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-right">Sessions</th>
              <th className="px-4 py-3 text-right">Total Rebuys</th>
              <th className="px-4 py-3 text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map((ps, i) => (
              <tr key={ps.playerId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/players/${ps.playerId}`} className="font-medium hover:text-green-400">
                    {ps.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right text-gray-400">{ps.sessions}</td>
                <td className="px-4 py-3 text-right text-gray-400">{ps.rebuys}</td>
                <td className={`px-4 py-3 text-right font-mono font-bold ${pnlColor(ps.pnl)}`}>
                  {fmt(ps.pnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/" className="text-sm text-gray-400 hover:text-white inline-block">
        ← Back to dashboard
      </Link>
    </div>
  );
}
