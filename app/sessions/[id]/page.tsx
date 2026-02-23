import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function pnlColor(v: number) {
  if (v > 0) return "text-green-400";
  if (v < 0) return "text-red-400";
  return "text-gray-400";
}

function fmt(v: number) {
  return (v >= 0 ? "+" : "") + v.toFixed(2);
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id: Number(id) },
    include: {
      gameType: true,
      event: true,
      participants: {
        include: { player: true },
        orderBy: { profitLoss: "desc" },
      },
    },
  });

  if (!session) notFound();

  const adminSession = await getSession();
  const isAdmin = adminSession.isAdmin;

  const totalPot = session.participants.reduce(
    (acc, p) => acc + p.buyIns * Number(session.maxBuyIn),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">
              {session.date.toISOString().split("T")[0]}
            </h1>
            <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded text-sm">
              {session.gameType.name}
            </span>
          </div>
          {session.event && (
            <p className="text-gray-400 text-sm">
              Event:{" "}
              <Link href={`/events/${session.event.id}`} className="text-green-400 hover:underline">
                {session.event.name}
              </Link>
            </p>
          )}
          {session.notes && (
            <p className="text-gray-400 text-sm mt-1">{session.notes}</p>
          )}
        </div>
        {isAdmin && (
          <Link
            href={`/admin/sessions/${session.id}/edit`}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors"
          >
            Edit Session
          </Link>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Max Buy-in</div>
          <div className="text-lg font-semibold text-white">{Number(session.maxBuyIn).toFixed(0)}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Players</div>
          <div className="text-lg font-semibold text-white">{session.participants.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Pot</div>
          <div className="text-lg font-semibold text-white">{totalPot.toFixed(0)}</div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-right">Buy-ins</th>
              <th className="px-4 py-3 text-right">Total In</th>
              <th className="px-4 py-3 text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            {session.participants.map((p) => {
              const pnl = Number(p.profitLoss);
              const totalIn = p.buyIns * Number(session.maxBuyIn);
              return (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <Link href={`/players/${p.player.id}`} className="font-medium hover:text-green-400 transition-colors">
                      {p.player.name}
                    </Link>
                    {p.player.isGuest && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">Guest</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">{p.buyIns}</td>
                  <td className="px-4 py-3 text-right text-gray-400">{totalIn.toFixed(0)}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${pnlColor(pnl)}`}>
                    {fmt(pnl)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Link href="/sessions" className="text-sm text-gray-400 hover:text-white inline-block">
        ← Back to sessions
      </Link>
    </div>
  );
}
