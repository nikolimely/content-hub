import { streamText } from "./llm";
import { listDirectory, getFileContent } from "./github";

export type Site = {
  name: string;
  domain: string;
  githubRepo: string;
  repoBranch: string;
  contentPath: string;
  model: string;
  brandVoice: string | null;
  tone: string | null;
  targetAudience: string | null;
  externalLinksPath: string | null;
};

export type ArticleInput = {
  title: string;
  keyword: string;
  slug: string;
};

async function readExistingContent(site: Site): Promise<string> {
  const files = await listDirectory(site.githubRepo, site.contentPath, site.repoBranch);
  const mdxFiles = files.filter((f) => f.name.endsWith(".mdx") || f.name.endsWith(".md")).slice(0, 20);

  const snippets = await Promise.all(
    mdxFiles.map(async (file) => {
      const content = await getFileContent(site.githubRepo, file.path, site.repoBranch);
      const titleMatch = content?.match(/title:\s*["']?(.+?)["']?\n/);
      const slug = file.name.replace(/\.(mdx?|md)$/, "");
      return `- [${titleMatch?.[1] || file.name}](/${slug})`;
    })
  );

  return snippets.join("\n");
}

async function readExternalLinks(site: Site): Promise<string> {
  // Always read from cms/external-links.md convention
  const content = await getFileContent(site.githubRepo, "cms/external-links.md", site.repoBranch);
  return content ?? "";
}

function buildPrompt(
  site: Site,
  article: ArticleInput,
  internalLinks: string,
  externalLinks: string,
  globalRules: string
): string {
  const today = new Date().toISOString().split("T")[0];

  return `You are writing a blog post for ${site.name} (${site.domain}), a UK-based SEO and digital marketing agency.
${site.brandVoice ? `\nBrand voice: ${site.brandVoice}` : ""}
${site.tone ? `Tone: ${site.tone}` : ""}
${site.targetAudience ? `Target audience: ${site.targetAudience}` : ""}

Write a comprehensive, SEO-optimised article in MDX format.

**Article details:**
- Title: ${article.title}
- Focus keyword: ${article.keyword}
- Date: ${today}

**Frontmatter — use this exact schema:**
\`\`\`
---
title: "${article.title}"
slug: "${article.slug || ""}"
date: "${today}"
description: "<150-160 character meta description including the focus keyword>"
category: "<most relevant category e.g. SEO, GEO, PPC, Content, Technical SEO>"
categorySlug: "<lowercase, hyphenated>"
author: "Paul"
---
\`\`\`

**Content requirements:**
1. Start the body immediately after frontmatter — NO H1 heading (the title serves as H1 on the page)
2. Do NOT open with "In this article..." or similar meta-commentary — open with a substantive paragraph that hooks the reader and establishes the topic immediately
3. Use UK English throughout (optimise, recognise, authoritative, colour, etc.)
4. Write 1,500–2,500 words of genuinely expert content — depth over length, no padding
5. Use ## for H2 sections, ### for H3 subsections
6. For numbered step sections, use ### Step N: format
7. For bold terms in lists, use **Term:** description format
8. Include specific data, statistics, and real examples wherever possible
9. Use relative internal links (e.g. /services/seo, /insights/slug) — do NOT use full URLs for internal links
10. End with a bold call-to-action paragraph linking to /get-started or a relevant service page
11. Do not include any images in the body — featuredImage in frontmatter only
12. Avoid keyword stuffing — use the focus keyword naturally where it fits

${internalLinks ? `**Existing content to link to (use 2–4 relevant ones naturally):**\n${internalLinks}\n` : ""}
${externalLinks ? `**External references (use 1–2 if genuinely relevant):**\n${externalLinks}\n` : ""}

**Example of correct opening style** (notice: no H1, jumps straight into substance):
"Topical authority is the degree to which search engines — and increasingly AI answer engines — recognise your website as a credible, comprehensive source on a particular subject. It is not a single metric you can check in a dashboard..."

Output ONLY the MDX — no explanation, no preamble, no code fences around the whole thing. Start with ---.
${globalRules ? `\n**Global writing rules (always follow these):**\n${globalRules}` : ""}`;
}

export async function generateArticleStream(
  site: Site,
  article: ArticleInput,
  onChunk: (text: string) => void,
  globalRules = ""
): Promise<string> {
  const [internalLinks, externalLinks] = await Promise.all([
    readExistingContent(site),
    readExternalLinks(site),
  ]);

  const prompt = buildPrompt(site, article, internalLinks, externalLinks, globalRules);
  let fullContent = "";

  await streamText(site.model || "claude-sonnet-4-6", prompt, 4096, (text) => {
    fullContent += text;
    onChunk(text);
  });

  return fullContent;
}
