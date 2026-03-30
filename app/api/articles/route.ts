import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("siteId");
  const articles = await db.article.findMany({
    where: siteId ? { siteId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { site: true },
  });
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { siteId, title, keyword, scheduledAt, authorId } = body;

  if (!siteId || !title || !keyword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const slug = toSlug(title);

  try {
    const article = await db.article.create({
      data: {
        siteId,
        title,
        slug,
        keyword,
        status: "planned",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        authorId: authorId || null,
      },
    });
    return NextResponse.json(article);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
