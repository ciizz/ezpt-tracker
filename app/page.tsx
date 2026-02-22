import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAllPlayersStats } from "@/lib/stats";

function pnlColor(v: number) {
  if (v > 0) return "text-green-400";
  if (v < 0) return "text-red-400";
  return "text-gray-400";
}

function fmt(v: number) {
  return (v >= 0 ? "+" : "") + v.toFixed(2);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ guests?: string }>;
}) {
  const sp = await searchParams;
  const includeGuests = sp.guests === "true";
  const year = new Date().getFullYear();

  const [stats, recentSessions] = await Promise.all([
    getAllPlayersStats(year, includeGuests),
    prisma.session.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        gameType: true,
        participants: { include: { player: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400">{year} Season</p>
      </div>

      {/* Leaderboard */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Leaderboard</h2>
          <div className="flex items-center gap-4">
            <Link
              href={includeGuests ? "/" : "/?guests=true"}
              className={`text-sm px-3 py-1.5 rounded border transition-colors ${includeGuests ? "border-green-500 text-green-400" : "border-gray-700 text-gray-400 hover:text-white"}`}
            >
              {includeGuests ? "Guests: On" : "Guests: Off"}
            </Link>
            <Link href="/stats" className="text-sm text-green-400 hover:text-green-300">
              Full stats →
            </Link>
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-right">Sessions</th>
                <th className="px-4 py-3 text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No data yet
                  </td>
                </tr>
              ) : (
                stats.map((s, i) => (
                  <tr key={s.playerId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/players/${s.playerId}`} className="font-medium hover:text-green-400 transition-colors">
                        {s.playerName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{s.totalSessions}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${pnlColor(s.totalPnl)}`}>
                      {fmt(s.totalPnl)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Sessions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Sessions</h2>
          <Link href="/sessions" className="text-sm text-green-400 hover:text-green-300">
            All sessions →
          </Link>
        </div>
        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <p className="text-gray-500">No sessions recorded yet.</p>
          ) : (
            recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block bg-gray-900 rounded-lg border border-gray-800 px-4 py-3 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">
                      {session.date.toISOString().split("T")[0]}
                    </span>
                    <span className="ml-3 text-sm text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                      {session.gameType.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {session.participants.length} players · Buy-in: {Number(session.maxBuyIn).toFixed(0)}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
