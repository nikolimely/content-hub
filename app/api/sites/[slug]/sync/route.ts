import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncSiteFromCms } from "@/lib/sync";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const site = await db.site.findUnique({ where: { slug } });
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  try {
    const result = await syncSiteFromCms(site.id);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
