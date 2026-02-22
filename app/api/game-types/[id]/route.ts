import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { updateGameTypeSchema } from "@/lib/validations";

export async function PATCH(
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
  const parsed = updateGameTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const gameType = await prisma.gameType.update({
      where: { id: Number(id) },
      data: parsed.data,
    });
    return NextResponse.json(gameType);
  } catch {
    return NextResponse.json({ error: "Game type not found" }, { status: 404 });
  }
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
  const numId = Number(id);

  const sessionCount = await prisma.session.count({
    where: { gameTypeId: numId },
  });
  if (sessionCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete: game type is used by existing sessions" },
      { status: 409 }
    );
  }

  try {
    await prisma.gameType.delete({ where: { id: numId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Game type not found" }, { status: 404 });
  }
}
