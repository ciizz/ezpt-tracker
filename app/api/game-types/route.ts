import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const gameTypes = await prisma.gameType.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(gameTypes);
}
