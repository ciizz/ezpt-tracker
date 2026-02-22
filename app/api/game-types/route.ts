import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createGameTypeSchema } from "@/lib/validations";

export async function GET() {
  const gameTypes = await prisma.gameType.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(gameTypes);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return err as Response;
  }

  const body = await req.json();
  const parsed = createGameTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const gameType = await prisma.gameType.create({ data: parsed.data });
    return NextResponse.json(gameType, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Game type name already exists" }, { status: 409 });
  }
}
