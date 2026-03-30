import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Called by Vercel Cron every hour — triggers deploys for sites with newly-due scheduled posts
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find sites that have at least one post due in the last hour
  // (scheduledAt <= now and scheduledAt > now - 1 hour, status = published)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const sites = await db.site.findMany({
    where: {
      deployHook: { not: null },
      articles: {
        some: {
          status: "published",
          scheduledAt: { lte: now, gt: oneHourAgo },
        },
      },
    },
  });

  const results: Record<string, string> = {};

  for (const site of sites) {
    try {
      const res = await fetch(site.deployHook!, { method: "POST" });
      results[site.slug] = res.ok ? "triggered" : `failed (${res.status})`;
    } catch (e) {
      results[site.slug] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({
    checked: now.toISOString(),
    sitesTriggered: Object.keys(results).length,
    results,
  });
}
