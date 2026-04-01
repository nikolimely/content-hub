import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function transformFeaturedImage(content: string, articleId: string, baseUrl: string): string {
  // Replace relative featuredImage paths with absolute Content Hub proxy URLs.
  // The proxy authenticates with GitHub server-side, so this works for private repos
  // and before the target site has redeployed with the new image.
  return content.replace(
    /^(featuredImage:\s*")(\/.+?)(")/m,
    (_, prefix, path, suffix) => {
      const proxyUrl = `${baseUrl}/api/articles/${articleId}/assets/proxy?path=public${path}`;
      return `${prefix}${proxyUrl}${suffix}`;
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

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://content.limely.co.uk";
  const content = transformFeaturedImage(article.content, articleId, baseUrl);

  return NextResponse.json({
    id: article.id,
    slug: article.slug,
    title: article.title,
    content,
    author: article.author?.name?.split(" ")[0] ?? `${article.site.name} Team`,
    site: {
      domain: article.site.domain,
      contentTypes: article.site.contentTypes,
    },
  });
}
