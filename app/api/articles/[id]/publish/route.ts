import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishArticle } from "@/lib/publish";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await db.article.findUnique({
    where: { id },
    include: { site: true },
  });

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (!article.content) {
    return NextResponse.json({ error: "Article has no content" }, { status: 400 });
  }

  try {
    await publishArticle({
      githubRepo: article.site.githubRepo,
      contentPath: article.site.contentPath,
      slug: article.slug,
      content: article.content,
      repoBranch: article.site.repoBranch,
    });

    // If frontmatter has a future date, sync it to scheduledAt
    const dateMatch = article.content.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    const frontmatterDate = dateMatch ? new Date(dateMatch[1]) : null;
    const isFuture = frontmatterDate && frontmatterDate > new Date();

    await db.article.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: new Date(),
        ...(isFuture && { scheduledAt: frontmatterDate }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await db.article.update({
      where: { id },
      data: { errorLog: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
