import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createEventSchema } from "@/lib/validations";

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { sessions: true } } },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return err as Response;
  }

  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { startDate, endDate, ...rest } = parsed.data;
  const event = await prisma.event.create({
    data: {
      ...rest,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
