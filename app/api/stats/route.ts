import { NextRequest, NextResponse } from "next/server";
import { getAllPlayersStats } from "@/lib/stats";
import { statsQuerySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = statsQuerySchema.safeParse({ year: searchParams.get("year") });
  const year = parsed.success ? parsed.data.year : undefined;

  const stats = await getAllPlayersStats(year);
  return NextResponse.json(stats);
}
