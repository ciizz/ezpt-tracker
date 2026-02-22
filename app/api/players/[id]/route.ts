import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { updatePlayerSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const player = await prisma.player.findUnique({ where: { id: Number(id) } });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(player);
}

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
  const parsed = updatePlayerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const player = await prisma.player.update({
      where: { id: Number(id) },
      data: parsed.data,
    });
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }
}
