import { streamText } from "./llm";
import { listDirectory, getFileContent } from "./github";

export type Site = {
  name: string;
  domain: string;
  description: string | null;
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

  return `You are writing a blog post for ${site.name} (${site.domain}).
${site.description ? `\nAbout this site: ${site.description}` : ""}
${site.brandVoice ? `\nBrand voice and article structure:\n${site.brandVoice}` : ""}
${site.tone ? `\nTone: ${site.tone}` : ""}
${site.targetAudience ? `\nTarget audience: ${site.targetAudience}` : ""}

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
category: "<most relevant category>"
categorySlug: "<lowercase, hyphenated>"
author: "Paul"
---
\`\`\`

**Content requirements:**
1. Start the body immediately after frontmatter — NO H1 heading (the title serves as H1 on the page)
2. Do NOT open with "In this article..." or similar meta-commentary — open with a substantive paragraph that hooks the reader and establishes the topic immediately
3. Follow the brand voice and article structure instructions above precisely
4. Write 1,500–2,500 words of genuinely expert content — depth over length, no padding
5. Use ## for H2 sections, ### for H3 subsections
6. Use question-format H2s wherever possible — they map directly to how AI systems and search engines extract answers
7. Lead each section with the answer or recommendation in the first sentence, then explain — AI systems extract passages, not full articles, so every section opener must stand alone as a useful statement
8. For numbered step sections, use ### Step N: format
9. For bold terms in lists, use **Term:** description format
10. Include specific data, statistics, and real examples wherever possible — vague claims have no value
11. Use comparison tables, numbered lists, and structured data wherever it helps — these are extracted by AI citation engines and scannable for readers
12. Keep paragraphs short — 2 to 4 sentences maximum
13. Use relative internal links (e.g. /services/seo, /insights/slug) — do NOT use full URLs for internal links
14. End with a bold call-to-action paragraph linking to a relevant page
15. Do not include any images in the body — featuredImage in frontmatter only
16. Avoid keyword stuffing — use the focus keyword naturally where it fits
17. NEVER use em dashes (the — character or --) anywhere in the article. Use a comma, colon, parenthesis, or rewrite the sentence. This rule is absolute with no exceptions.

${internalLinks ? `**Existing content to link to (use 2–4 relevant ones naturally):**\n${internalLinks}\n` : ""}
${externalLinks ? `**External references (use 1–2 if genuinely relevant):**\n${externalLinks}\n` : ""}

**Example of correct opening style** (no H1, jumps straight into substance, no em dashes):
"Topical authority is the degree to which search engines, and increasingly AI answer engines, recognise your website as a credible and comprehensive source on a particular subject. It is not a single metric you can check in a dashboard."

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

  await streamText(site.model || "claude-sonnet-4-6", prompt, 6000, (text) => {
    fullContent += text;
    onChunk(text);
  });

  return fullContent;
}
