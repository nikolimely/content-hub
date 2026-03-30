import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncSiteFromCms } from "@/lib/sync";

// Called by Vercel Cron — configured in vercel.json
// Syncs all sites from their cms/ folders
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sites = await db.site.findMany();
  const results: Record<string, unknown> = {};

  for (const site of sites) {
    try {
      results[site.slug] = await syncSiteFromCms(site.id);
    } catch (err) {
      results[site.slug] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json({ synced: new Date().toISOString(), results });
}
