import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFileSha, putFile } from "@/lib/github";

// Called by Vercel Cron every hour — triggers deploys for sites with newly-due scheduled posts
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // 70 minutes — slightly wider than the hourly cron interval to handle timing variance,
  // but narrow enough that each article only triggers one deploy.
  const seventyMinutesAgo = new Date(now.getTime() - 70 * 60 * 1000);

  const isMonday = now.getUTCDay() === 1;

  const sites = await db.site.findMany({
    where: {
      deployHook: { not: null },
      articles: {
        some: {
          status: "published",
          scheduledAt: { lte: now, gt: seventyMinutesAgo },
          deployedAt: null,
        },
      },
    },
    include: {
      articles: {
        where: {
          status: "published",
          scheduledAt: { lte: now, gt: seventyMinutesAgo },
          deployedAt: null,
        },
        select: { id: true },
      },
    },
  });

  const results: Record<string, string> = {};

  for (const site of sites) {
    if (site.deployFrequency === "weekly" && !isMonday) {
      results[site.slug] = "skipped (weekly — not Monday)";
      continue;
    }

    const hook = site.deployHook!;
    try {
      if (hook.startsWith("github:")) {
        // Railway (or any git-based host): push a timestamp commit to trigger rebuild
        const repo = hook.slice("github:".length);
        const branch = site.repoBranch || "main";
        const sha = await getFileSha(repo, "cms/last-deployed.txt", branch);
        await putFile(repo, "cms/last-deployed.txt", now.toISOString(), branch, "chore: trigger redeploy", sha);
        results[site.slug] = "github-push triggered";
      } else {
        const res = await fetch(hook, { method: "POST" });
        results[site.slug] = res.ok ? "triggered" : `failed (${res.status})`;
      }

      // Mark articles as deployed so this hook is not fired again on the next cron run
      await db.article.updateMany({
        where: { id: { in: site.articles.map((a) => a.id) } },
        data: { deployedAt: now },
      });
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
