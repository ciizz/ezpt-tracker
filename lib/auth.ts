import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface SessionData {
  isAdmin: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "ezpt-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, new NextResponse(), sessionOptions);
}

/** Throws a 401 response if the request is not from an admin. */
export async function requireAdmin(req: NextRequest): Promise<void> {
  const session = await getIronSession<SessionData>(
    req,
    new NextResponse(),
    sessionOptions
  );
  if (!session.isAdmin) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}
