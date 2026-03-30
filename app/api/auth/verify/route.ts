import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken, signSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid", req.url));
  }

  const payload = await verifyMagicToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  const session = await signSession(payload.email);

  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
