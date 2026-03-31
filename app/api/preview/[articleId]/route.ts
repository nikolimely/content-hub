import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function transformFeaturedImage(content: string, githubRepo: string, repoBranch: string): string {
  // Replace relative featuredImage paths with absolute raw GitHub URLs so preview
  // works before the target site has redeployed with the new image.
  return content.replace(
    /^(featuredImage:\s*")(\/.+?)(")/m,
    (_, prefix, path, suffix) => {
      const absolute = `https://raw.githubusercontent.com/${githubRepo}/${repoBranch}/public${path}`;
      return `${prefix}${absolute}${suffix}`;
    }
  );
}

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

  const content = transformFeaturedImage(
    article.content,
    article.site.githubRepo,
    article.site.repoBranch
  );

  return NextResponse.json({
    id: article.id,
    slug: article.slug,
    title: article.title,
    content,
    author: article.author?.name?.split(" ")[0] ?? "Dynamically Team",
    site: {
      domain: article.site.domain,
      contentTypes: article.site.contentTypes,
    },
  });
}
