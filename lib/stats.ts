import { prisma } from "./db";
import { Prisma } from "@prisma/client";

export interface PlayerStats {
  playerId: number;
  playerName: string;
  totalPnl: number;
  totalSessions: number;
  totalRebuys: number;
  avgRebuysPerSession: number;
  avgPnlPerSession: number;
  bestSession: { sessionId: number; date: string; pnl: number } | null;
  worstSession: { sessionId: number; date: string; pnl: number } | null;
  pnlByGameType: Record<string, number>;
}

function toNum(d: Prisma.Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : Number(d.toString());
}

function buildDateFilter(year?: number) {
  if (!year) return {};
  return {
    date: {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    },
  };
}

export async function getPlayerStats(
  playerId: number,
  year?: number
): Promise<PlayerStats | null> {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return null;

  const participants = await prisma.sessionParticipant.findMany({
    where: {
      playerId,
      session: buildDateFilter(year),
    },
    include: {
      session: {
        include: { gameType: true },
      },
    },
  });

  if (participants.length === 0) {
    return {
      playerId,
      playerName: player.name,
      totalPnl: 0,
      totalSessions: 0,
      totalRebuys: 0,
      avgRebuysPerSession: 0,
      avgPnlPerSession: 0,
      bestSession: null,
      worstSession: null,
      pnlByGameType: {},
    };
  }

  let totalPnl = 0;
  let totalRebuys = 0;
  let bestSession: PlayerStats["bestSession"] = null;
  let worstSession: PlayerStats["worstSession"] = null;
  const pnlByGameType: Record<string, number> = {};

  for (const p of participants) {
    const pnl = toNum(p.profitLoss);
    totalPnl += pnl;
    totalRebuys += p.rebuys;

    const gameTypeName = p.session.gameType.name;
    pnlByGameType[gameTypeName] = (pnlByGameType[gameTypeName] ?? 0) + pnl;

    const sessionInfo = {
      sessionId: p.sessionId,
      date: p.session.date.toISOString().split("T")[0],
      pnl,
    };

    if (!bestSession || pnl > bestSession.pnl) bestSession = sessionInfo;
    if (!worstSession || pnl < worstSession.pnl) worstSession = sessionInfo;
  }

  const totalSessions = participants.length;

  return {
    playerId,
    playerName: player.name,
    totalPnl,
    totalSessions,
    totalRebuys,
    avgRebuysPerSession: totalRebuys / totalSessions,
    avgPnlPerSession: totalPnl / totalSessions,
    bestSession,
    worstSession,
    pnlByGameType,
  };
}

export async function getAllPlayersStats(year?: number, includeGuests = false): Promise<PlayerStats[]> {
  const players = await prisma.player.findMany({
    where: { isActive: true, ...(includeGuests ? {} : { isGuest: false }) },
    orderBy: { name: "asc" },
  });

  const stats = await Promise.all(
    players.map((p) => getPlayerStats(p.id, year))
  );

  return (stats.filter(Boolean) as PlayerStats[]).sort(
    (a, b) => b.totalPnl - a.totalPnl
  );
}

export async function getEventStats(eventId: number) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      sessions: {
        include: {
          participants: {
            include: { player: true },
          },
          gameType: true,
        },
      },
    },
  });

  if (!event) return null;

  // Aggregate per-player stats scoped to this event's sessions
  const playerMap: Record<
    number,
    { name: string; pnl: number; sessions: number; rebuys: number }
  > = {};

  for (const session of event.sessions) {
    for (const p of session.participants) {
      if (!playerMap[p.playerId]) {
        playerMap[p.playerId] = {
          name: p.player.name,
          pnl: 0,
          sessions: 0,
          rebuys: 0,
        };
      }
      playerMap[p.playerId].pnl += toNum(p.profitLoss);
      playerMap[p.playerId].sessions += 1;
      playerMap[p.playerId].rebuys += p.rebuys;
    }
  }

  const playerStats = Object.entries(playerMap)
    .map(([id, s]) => ({ playerId: Number(id), ...s }))
    .sort((a, b) => b.pnl - a.pnl);

  return {
    event: {
      id: event.id,
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      description: event.description,
    },
    totalSessions: event.sessions.length,
    playerStats,
  };
}
