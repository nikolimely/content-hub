import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateArticleStream } from "@/lib/generate";

export async function POST(
  req: NextRequest,
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

  // Update status to generating
  await db.article.update({
    where: { id },
    data: { status: "generating" },
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = "";

        await generateArticleStream(
          article.site,
          { title: article.title, keyword: article.keyword, slug: article.slug },
          (chunk) => {
            fullContent += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
            );
          }
        );

        // Fix double heading markers (e.g. "## ### Step 1:" → "### Step 1:")
        fullContent = fullContent.replace(/^#{1,6}\s+(#{1,6}\s+)/gm, "$1");

        // Save to DB
        await db.article.update({
          where: { id },
          data: { content: fullContent, status: "draft" },
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await db.article.update({
          where: { id },
          data: { status: "planned", errorLog: msg },
        });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
