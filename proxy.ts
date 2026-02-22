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

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const res = new NextResponse();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session.isAdmin) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
