import { NextRequest, NextResponse } from "next/server";
import { getEventStats } from "@/lib/stats";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getEventStats(Number(id));
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
