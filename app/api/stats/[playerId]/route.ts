import { NextRequest, NextResponse } from "next/server";
import { getPlayerStats } from "@/lib/stats";
import { statsQuerySchema } from "@/lib/validations";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  const { searchParams } = new URL(req.url);
  const parsed = statsQuerySchema.safeParse({ year: searchParams.get("year") });
  const year = parsed.success ? parsed.data.year : undefined;

  const stats = await getPlayerStats(Number(playerId), year);
  if (!stats) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  return NextResponse.json(stats);
}
