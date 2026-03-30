import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await params;
  const secret = req.nextUrl.searchParams.get("secret");

  if (!secret || secret !== process.env.PREVIEW_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const article = await db.article.findUnique({
    where: { id: articleId },
    include: { site: true, author: true },
  });

  if (!article || !article.content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: article.id,
    slug: article.slug,
    title: article.title,
    content: article.content,
    author: article.author?.name?.split(" ")[0] ?? "Dynamically Team",
    site: {
      domain: article.site.domain,
      contentTypes: article.site.contentTypes,
    },
  });
}
