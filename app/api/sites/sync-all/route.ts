import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncSiteFromCms } from "@/lib/sync";

export async function POST() {
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
