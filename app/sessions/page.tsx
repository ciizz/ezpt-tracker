import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import SessionFilters from "@/app/components/SessionFilters";

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; gameTypeId?: string }>;
}) {
  const params = await searchParams;
  const year = params.year ? Number(params.year) : undefined;
  const gameTypeId = params.gameTypeId ? Number(params.gameTypeId) : undefined;

  const where: Record<string, unknown> = {};
  if (year) {
    where.date = {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    };
  }
  if (gameTypeId) where.gameTypeId = gameTypeId;

  const [sessions, gameTypes, adminSession] = await Promise.all([
    prisma.session.findMany({
      where,
      include: {
        gameType: true,
        participants: { include: { player: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.gameType.findMany({ orderBy: { name: "asc" } }),
    getSession(),
  ]);

  const isAdmin = adminSession.isAdmin;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2025 + 1 }, (_, i) => 2025 + i).reverse();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Sessions</h1>
        {isAdmin && (
          <Link
            href="/admin/sessions/new"
            className="text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded transition-colors"
          >
            + New Session
          </Link>
        )}
      </div>

      <SessionFilters
        years={years}
        gameTypes={gameTypes}
        currentYear={year}
        currentGameTypeId={gameTypeId}
      />

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Game</th>
              <th className="px-4 py-3 text-right">Buy-in</th>
              <th className="px-4 py-3 text-right">Players</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No sessions found
                </td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <Link href={`/sessions/${session.id}`} className="hover:text-green-400 transition-colors font-medium">
                      {session.date.toISOString().split("T")[0]}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs">
                      {session.gameType.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{Number(session.maxBuyIn).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{session.participants.length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
