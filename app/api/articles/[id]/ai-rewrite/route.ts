import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { streamText } from "@/lib/llm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { selectedText, instruction, type } = (await req.json()) as {
    selectedText: string;
    instruction: string;
    type: "selection" | "full";
  };

  const [article, globalSettings] = await Promise.all([
    db.article.findUnique({ where: { id }, include: { site: true } }),
    db.settings.findUnique({ where: { id: "global" } }),
  ]);

  const model = article?.site?.model || "claude-sonnet-4-6";
  const globalRules = globalSettings?.systemPrompt ?? "";

  const prompt =
    type === "selection"
      ? `Rewrite the following text according to this instruction: "${instruction}"

Text to rewrite:
${selectedText}

Return ONLY the rewritten text — no explanation, no preamble, no surrounding quotes. Preserve markdown formatting (bold, italic, links, headings) where appropriate.${globalRules ? `\n\nGlobal writing rules (always follow):\n${globalRules}` : ""}`
      : `Edit the following article according to this instruction: "${instruction}"

Article:
${selectedText}

Return ONLY the edited article content. Preserve the frontmatter block (--- ... ---) exactly as-is unless the instruction specifically requires changing it. Preserve all markdown formatting.${globalRules ? `\n\nGlobal writing rules (always follow):\n${globalRules}` : ""}`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamText(model, prompt, type === "full" ? 8192 : 1024, (text) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
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
