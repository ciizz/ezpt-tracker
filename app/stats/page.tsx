import Link from "next/link";
import { getAllPlayersStats } from "@/lib/stats";
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

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; guests?: string }>;
}) {
  const [sp, adminSession] = await Promise.all([searchParams, getSession()]);
  const isAdmin = adminSession.isAdmin;
  const currentYear = new Date().getFullYear();

  // Non-admins always see a specific year, never all-time
  const year = sp.year ? Number(sp.year) : (isAdmin ? undefined : currentYear);
  const includeGuests = sp.guests === "true";
  const stats = await getAllPlayersStats(year, includeGuests);
  const years = Array.from({ length: currentYear - 2025 + 1 }, (_, i) => 2025 + i).reverse();

  // Collect all game types present
  const gameTypes = Array.from(
    new Set(stats.flatMap((s) => Object.keys(s.pnlByGameType)))
  ).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistics</h1>
          {year && <p className="text-gray-400 text-sm mt-1">Season {year}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/stats?${new URLSearchParams({ ...(year ? { year: String(year) } : {}), ...(includeGuests ? {} : { guests: "true" }) }).toString()}`}
            className={`text-sm px-3 py-2 rounded border transition-colors ${includeGuests ? "border-green-500 text-green-400" : "border-gray-700 text-gray-400 hover:text-white"}`}
          >
            {includeGuests ? "Guests: On" : "Guests: Off"}
          </Link>
          <YearSelect
            pathname="/stats"
            years={years}
            currentYear={year}
            isAdmin={isAdmin}
            extraParams={includeGuests ? { guests: "true" } : undefined}
          />
        </div>
      </div>

      {/* Main Stats Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-right">Sessions</th>
              <th className="px-4 py-3 text-right">Total P&L</th>
              <th className="px-4 py-3 text-right">Avg P&L</th>
              <th className="px-4 py-3 text-right">Avg Rebuys</th>
              <th className="px-4 py-3 text-right">Best</th>
              <th className="px-4 py-3 text-right">Worst</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              stats.map((s, i) => (
                <tr key={s.playerId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/players/${s.playerId}${year ? `?year=${year}` : ""}`} className="font-medium hover:text-green-400 transition-colors">
                      {s.playerName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{s.totalSessions}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${pnlColor(s.totalPnl)}`}>
                    {fmt(s.totalPnl)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${pnlColor(s.avgPnlPerSession)}`}>
                    {fmt(s.avgPnlPerSession)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {s.avgRebuysPerSession.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-green-400">
                    {s.bestSession ? fmt(s.bestSession.pnl) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-red-400">
                    {s.worstSession ? fmt(s.worstSession.pnl) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* P&L by Game Type */}
      {stats.length > 0 && gameTypes.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">P&L by Game Type</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Player</th>
                  {gameTypes.map((gt) => (
                    <th key={gt} className="px-4 py-3 text-right">{gt}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.playerId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium">{s.playerName}</td>
                    {gameTypes.map((gt) => {
                      const v = s.pnlByGameType[gt] ?? 0;
                      return (
                        <td key={gt} className={`px-4 py-3 text-right font-mono ${pnlColor(v)}`}>
                          {v !== 0 ? fmt(v) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
