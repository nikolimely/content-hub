import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFileContent, getFileSha, putFile, listDirectory } from "@/lib/github";
import { streamText } from "@/lib/llm";

type AuditType = "seo-audit" | "content-strategy" | "content-calendar" | "implementation-roadmap";

const AUDIT_META: Record<AuditType, { label: string; filename: string }> = {
  "seo-audit": {
    label: "SEO Audit",
    filename: `seo-audit-${new Date().getFullYear()}.md`,
  },
  "content-strategy": {
    label: "Content Strategy",
    filename: `content-strategy-${new Date().getFullYear()}.md`,
  },
  "content-calendar": {
    label: "Content Calendar",
    filename: `content-calendar-${new Date().getFullYear()}.md`,
  },
  "implementation-roadmap": {
    label: "Implementation Roadmap",
    filename: `implementation-roadmap.md`,
  },
};

function buildPrompt(type: AuditType, site: {
  name: string;
  domain: string;
  brandVoice: string | null;
  tone: string | null;
  targetAudience: string | null;
}, existingContent: string[], externalLinks: string): string {
  const today = new Date().toISOString().split("T")[0];
  const contentSample = existingContent.slice(0, 30).join("\n");

  const base = `You are an expert SEO and content strategist. The following is information about a website you are auditing/planning for.

**Site:** ${site.name} (${site.domain})
**Date:** ${today}
${site.brandVoice ? `**Brand voice:** ${site.brandVoice}` : ""}
${site.targetAudience ? `**Target audience:** ${site.targetAudience}` : ""}
${contentSample ? `\n**Existing content (sample):**\n${contentSample}` : ""}
${externalLinks ? `\n**Reference sources:**\n${externalLinks}` : ""}`;

  const prompts: Record<AuditType, string> = {
    "seo-audit": `${base}

Write a comprehensive SEO audit report for ${site.domain}. Structure it with these sections:

# SEO Audit Report — ${site.domain}
**Date:** ${today}

## Executive Summary
Brief overall assessment and score (X/100).

## Technical SEO
Core Web Vitals, crawlability, indexability, mobile, HTTPS, structured data.

## On-Page SEO
Title tags, meta descriptions, heading hierarchy, keyword usage, internal linking.

## Content Analysis
Content quality, depth, coverage gaps, topical authority, E-E-A-T signals.

## Backlink Profile
Domain authority, link quality, anchor text distribution, opportunities.

## Competitive Gaps
What competitors rank for that this site doesn't.

## Quick Wins
5–10 specific actions that would have the most impact in the shortest time.

## Recommended Next Steps
Prioritised action list with effort/impact ratings.

Use UK English. Be specific and actionable. Include example fixes where relevant.`,

    "content-strategy": `${base}

Write a comprehensive content strategy document for ${site.domain}. Structure it as:

# Content Strategy — ${site.domain}
**Date:** ${today}

## Overview
Strategic positioning and content goals.

## Topical Authority Map
Core topics and sub-topics to own. Organise as a cluster structure.

## Keyword Opportunities
Priority keywords by category — include search intent and difficulty tiers.

## Content Pillars
3–5 main content pillars with rationale.

## Content Formats
What types of content to produce (guides, comparisons, listicles, case studies etc.) and why.

## Internal Linking Strategy
How to structure internal links to build authority.

## Distribution & Promotion
How to amplify content once published.

## Success Metrics
KPIs to track — organic traffic, rankings, engagement.

Use UK English. Be specific to the site's niche and audience.`,

    "content-calendar": `${base}

Create a 3-month content calendar for ${site.domain}. Structure it as:

# Content Calendar — ${site.domain}
**Period:** ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })} — ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
**Cadence:** 2 posts per week

## Strategy Notes
Brief rationale for the calendar themes.

## Month 1
### Week 1
- **Post 1:** [Title] — [keyword] — [category] — [angle/hook]
- **Post 2:** [Title] — [keyword] — [category] — [angle/hook]
(repeat for each week)

## Month 2
(same format)

## Month 3
(same format)

## Topic Themes by Month
What overarching themes each month focuses on and why.

Titles should be specific, SEO-optimised, and varied in format (how-to, listicle, guide, comparison, case study). UK English.`,

    "implementation-roadmap": `${base}

Create a prioritised implementation roadmap for ${site.domain}. Structure it as:

# Implementation Roadmap — ${site.domain}
**Date:** ${today}

## Overview
Summary of the roadmap approach and priorities.

## Phase 1: Quick Wins (0–4 weeks)
Tasks that are low effort, high impact. Include owner (Dev/Content/SEO), effort estimate, and expected impact.

## Phase 2: Foundation (1–3 months)
Core structural improvements. Same format.

## Phase 3: Growth (3–6 months)
Content and authority building. Same format.

## Phase 4: Scale (6–12 months)
Longer-term initiatives. Same format.

## Task Summary Table
| Task | Phase | Effort | Impact | Owner |
|------|-------|--------|--------|-------|
(list all tasks from above)

## Dependencies & Notes
Any blockers or sequencing requirements.

UK English. Be specific — name actual pages, URLs, or content pieces where possible.`,
  };

  return prompts[type];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { type } = (await req.json()) as { type: AuditType };

  if (!AUDIT_META[type]) {
    return NextResponse.json({ error: "Invalid audit type" }, { status: 400 });
  }

  const site = await db.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Gather context
  const [externalLinksRaw, contentFiles] = await Promise.all([
    getFileContent(site.githubRepo, "cms/external-links.md", site.repoBranch),
    listDirectory(site.githubRepo, site.contentPath, site.repoBranch),
  ]);

  // Build a list of existing content titles from frontmatter
  const mdxFiles = contentFiles
    .filter((f) => f.name.endsWith(".mdx") || f.name.endsWith(".md"))
    .slice(0, 30);
  const contentSamples = await Promise.all(
    mdxFiles.map(async (f) => {
      const content = await getFileContent(site.githubRepo, f.path, site.repoBranch);
      const titleMatch = content?.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      const keywordMatch = content?.match(/^keyword:\s*["']?(.+?)["']?\s*$/m);
      const categoryMatch = content?.match(/^category:\s*["']?(.+?)["']?\s*$/m);
      const title = titleMatch?.[1] ?? f.name;
      const kw = keywordMatch?.[1];
      const cat = categoryMatch?.[1];
      return `- ${title}${kw ? ` [${kw}]` : ""}${cat ? ` — ${cat}` : ""}`;
    })
  );

  const prompt = buildPrompt(
    type,
    {
      name: site.name,
      domain: site.domain,
      brandVoice: site.brandVoice,
      tone: site.tone,
      targetAudience: site.targetAudience,
    },
    contentSamples,
    externalLinksRaw ?? ""
  );

  const meta = AUDIT_META[type];
  const filePath = `cms/audits/${meta.filename}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = "";

        await streamText(site.model || "claude-sonnet-4-6", prompt, 8192, (text) => {
          fullContent += text;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        });

        // Commit to GitHub
        const sha = await getFileSha(site.githubRepo, filePath, site.repoBranch);
        await putFile(
          site.githubRepo,
          filePath,
          fullContent,
          site.repoBranch,
          `docs: generate ${meta.label} for ${site.domain}`,
          sha ?? undefined
        );

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, filePath })}\n\n`)
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
