import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) return new NextResponse(null, { status: 400 });

  try {
    const res = await fetch(`https://geticon.dev/api/logos?domain=${encodeURIComponent(domain)}`, {
      next: { revalidate: 86400 }, // cache for 24 hours
    });
    if (!res.ok) return new NextResponse(null, { status: 404 });
    const data = await res.json() as { logo_url?: string };
    if (!data.logo_url) return new NextResponse(null, { status: 404 });
    return NextResponse.redirect(data.logo_url);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
