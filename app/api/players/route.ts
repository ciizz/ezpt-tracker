import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createPlayerSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  const players = await prisma.player.findMany({
    where: all ? undefined : { isActive: true },
    orderBy: [{ isGuest: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(players);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return err as Response;
  }

  const body = await req.json();
  const parsed = createPlayerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const player = await prisma.player.create({ data: parsed.data });
    return NextResponse.json(player, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Player name already exists" }, { status: 409 });
  }
}
