import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "content_hub_session";
const PUBLIC_PREFIXES = ["/login", "/api/auth/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const s = process.env.AUTH_SECRET;
      if (!s) throw new Error("AUTH_SECRET not set");
      await jwtVerify(token, new TextEncoder().encode(s));
      return NextResponse.next();
    } catch {
      // invalid / expired — fall through
    }
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
