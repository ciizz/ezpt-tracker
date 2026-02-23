import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPlayerStats } from "@/lib/stats";
import { getSession } from "@/lib/auth";
import YearSelect from "@/app/components/YearSelect";

function pnlColor(v: number) {
  if (v > 0) return "text-green-400";
  if (v < 0) return "text-red-400";
  return "text-gray-400";
}

function fmt(v: number) {
  return (v >= 0 ? "+" : "") + v.toFixed(2);
}

export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { id } = await params;
  const [sp, adminSession] = await Promise.all([searchParams, getSession()]);
  const isAdmin = adminSession.isAdmin;

  const currentYear = new Date().getFullYear();
  // Non-admins always see a specific year; admins default to all-time (undefined)
  const year = sp.year ? Number(sp.year) : (isAdmin ? undefined : currentYear);

  const player = await prisma.player.findUnique({ where: { id: Number(id) } });
  if (!player) notFound();

  const [stats, recentParticipations] = await Promise.all([
    getPlayerStats(Number(id), year),
    prisma.sessionParticipant.findMany({
      where: { playerId: Number(id) },
      include: { session: { include: { gameType: true } } },
      orderBy: { session: { date: "desc" } },
      take: 10,
    }),
  ]);

  const years = Array.from({ length: currentYear - 2025 + 1 }, (_, i) => 2025 + i).reverse();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-white">{player.name}</h1>
          {player.isGuest && (
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">Guest</span>
          )}
          {!player.isActive && (
            <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">Archived</span>
          )}
        </div>

        <div className="mt-3">
          <YearSelect
            pathname={`/players/${id}`}
            years={years}
            currentYear={year}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total P&L" value={fmt(stats.totalPnl)} valueClass={pnlColor(stats.totalPnl)} />
            <StatCard label="Sessions" value={stats.totalSessions.toString()} />
            <StatCard label="Avg P&L" value={fmt(stats.avgPnlPerSession)} valueClass={pnlColor(stats.avgPnlPerSession)} />
            <StatCard label="Avg Buy-ins" value={stats.avgBuyInsPerSession.toFixed(2)} />
          </div>

          {/* Best / Worst */}
          <div className="grid grid-cols-2 gap-4">
            {stats.bestSession && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Best Session</div>
                <div className="text-green-400 font-mono font-bold text-lg">{fmt(stats.bestSession.pnl)}</div>
                <div className="text-gray-400 text-sm mt-1">
                  <Link href={`/sessions/${stats.bestSession.sessionId}`} className="hover:text-white">
                    {stats.bestSession.date}
                  </Link>
                </div>
              </div>
            )}
            {stats.worstSession && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Worst Session</div>
                <div className="text-red-400 font-mono font-bold text-lg">{fmt(stats.worstSession.pnl)}</div>
                <div className="text-gray-400 text-sm mt-1">
                  <Link href={`/sessions/${stats.worstSession.sessionId}`} className="hover:text-white">
                    {stats.worstSession.date}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* P&L by Game Type */}
          {Object.keys(stats.pnlByGameType).length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">P&L by Game Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.pnlByGameType).map(([game, pnl]) => (
                  <div key={game}>
                    <div className="text-xs text-gray-400 mb-1">{game}</div>
                    <div className={`font-mono font-semibold ${pnlColor(pnl)}`}>{fmt(pnl)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Recent Sessions */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3">Recent Sessions</h2>
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Game</th>
                <th className="px-4 py-3 text-right">Buy-ins</th>
                <th className="px-4 py-3 text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {recentParticipations.map((p) => {
                const pnl = Number(p.profitLoss);
                return (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <Link href={`/sessions/${p.sessionId}`} className="hover:text-green-400">
                        {p.session.date.toISOString().split("T")[0]}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-green-400">{p.session.gameType.name}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{p.buyIns}</td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${pnlColor(pnl)}`}>
                      {fmt(pnl)}
                    </td>
                  </tr>
                );
              })}
              {recentParticipations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No sessions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Link
        href={year ? `/players?year=${year}` : "/players"}
        className="text-sm text-gray-400 hover:text-white inline-block"
      >
        ← Back to players
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${valueClass}`}>{value}</div>
    </div>
  );
}
