import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createSessionSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const gameTypeId = searchParams.get("gameTypeId");
  const playerId = searchParams.get("playerId");

  const where: Record<string, unknown> = {};

  if (year) {
    const y = Number(year);
    where.date = {
      gte: new Date(`${y}-01-01`),
      lt: new Date(`${y + 1}-01-01`),
    };
  }
  if (gameTypeId) where.gameTypeId = Number(gameTypeId);
  if (playerId) {
    where.participants = { some: { playerId: Number(playerId) } };
  }

  const sessions = await prisma.session.findMany({
    where,
    include: {
      gameType: true,
      event: true,
      participants: {
        include: { player: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return err as Response;
  }

  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { participants, date, ...sessionData } = parsed.data;

  const session = await prisma.session.create({
    data: {
      ...sessionData,
      date: new Date(date),
      participants: {
        create: participants.map((p) => ({
          playerId: p.playerId,
          buyIns: p.buyIns,
          profitLoss: p.profitLoss,
        })),
      },
    },
    include: {
      gameType: true,
      participants: { include: { player: true } },
    },
  });

  return NextResponse.json(session, { status: 201 });
}
