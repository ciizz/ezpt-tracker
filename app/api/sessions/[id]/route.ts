import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { updateSessionSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id: Number(id) },
    include: {
      gameType: true,
      event: true,
      participants: { include: { player: true } },
    },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return err as Response;
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { participants, date, ...sessionData } = parsed.data;

  // Rebuild participants if provided (delete all, re-create)
  const session = await prisma.$transaction(async (tx) => {
    if (participants) {
      await tx.sessionParticipant.deleteMany({ where: { sessionId: Number(id) } });
    }

    return tx.session.update({
      where: { id: Number(id) },
      data: {
        ...sessionData,
        ...(date ? { date: new Date(date) } : {}),
        ...(participants
          ? {
              participants: {
                create: participants.map((p) => ({
                  playerId: p.playerId,
                  rebuys: p.rebuys,
                  profitLoss: p.profitLoss,
                })),
              },
            }
          : {}),
      },
      include: {
        gameType: true,
        participants: { include: { player: true } },
      },
    });
  });

  return NextResponse.json(session);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return err as Response;
  }

  const { id } = await params;
  await prisma.session.delete({ where: { id: Number(id) } });
  return new NextResponse(null, { status: 204 });
}
