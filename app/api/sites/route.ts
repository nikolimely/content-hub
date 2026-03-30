import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const sites = await db.site.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(sites);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, slug, domain, githubRepo, repoBranch, contentPath, assetsPath, brandVoice, tone, targetAudience } = body;

  if (!name || !slug || !domain || !githubRepo) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const site = await db.site.create({
      data: {
        name,
        slug,
        domain,
        githubRepo,
        repoBranch: repoBranch || "main",
        contentPath: contentPath || "content/blog",
        assetsPath: assetsPath || "public/images/blog",
        brandVoice: brandVoice || null,
        tone: tone || null,
        targetAudience: targetAudience || null,
      },
    });
    return NextResponse.json(site);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
