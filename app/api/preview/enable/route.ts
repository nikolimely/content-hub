import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get("articleId");
  if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

  const article = await db.article.findUnique({
    where: { id: articleId },
    include: { site: true },
  });

  if (!article || !article.content) {
    return NextResponse.json({ error: "Article not found or has no content" }, { status: 404 });
  }

  const secret = process.env.PREVIEW_SECRET;
  if (!secret) return NextResponse.json({ error: "PREVIEW_SECRET not configured" }, { status: 500 });

  // Derive the live URL path from contentTypes
  let urlPath = "/blog";
  if (article.site.contentTypes) {
    try {
      const types = JSON.parse(article.site.contentTypes) as { url?: string }[];
      if (types[0]?.url) urlPath = types[0].url;
    } catch { /* ignore */ }
  }

  const previewUrl =
    `https://${article.site.domain}/api/enable-draft` +
    `?secret=${secret}&slug=${article.slug}&articleId=${articleId}`;

  return NextResponse.redirect(previewUrl);
}
