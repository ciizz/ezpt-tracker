import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData } from "@/lib/auth";

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "ezpt-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function GET(req: NextRequest) {
  const res = new NextResponse();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  return NextResponse.json({ isAdmin: session.isAdmin ?? false });
}
