#!/usr/bin/env node
/**
 * Content Calendar Generator
 * Usage: node scripts/content-calendar.mjs
 */

import { neon } from "@neondatabase/serverless";
import Anthropic from "@anthropic-ai/sdk";
import readline from "node:readline/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function hr() { console.log("\n" + "─".repeat(60) + "\n"); }

async function stream(prompt, system = "") {
  const params = {
    model: "claude-opus-4-6",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
    ...(system && { system }),
  };
  process.stdout.write("\n");
  let full = "";
  for await (const chunk of anthropic.messages.stream(params)) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      process.stdout.write(chunk.delta.text);
      full += chunk.delta.text;
    }
  }
  process.stdout.write("\n");
  return full;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function randomId() {
  return "c" + Math.random().toString(36).slice(2, 14);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🗓  Content Calendar Generator\n");

  // 1. Load sites
  const sites = await sql`SELECT id, name, domain, "brandVoice", tone, "targetAudience", description FROM "Site" ORDER BY name`;
  if (!sites.length) { console.log("No sites found."); process.exit(1); }

  console.log("Sites:\n");
  sites.forEach((s, i) => console.log(`  ${i + 1}. ${s.name} (${s.domain})`));

  const pick = await rl.question("\nChoose a site (number): ");
  const site = sites[parseInt(pick, 10) - 1];
  if (!site) { console.log("Invalid selection."); process.exit(1); }

  const months = await rl.question("How many months? (default: 3): ") || "3";
  const startFrom = await rl.question("Start from (e.g. April 2026): ") || "next month";

  // Load or create site context file
  const contextDir = path.join(__dirname, "../content-plans/context");
  if (!fs.existsSync(contextDir)) fs.mkdirSync(contextDir, { recursive: true });
  const contextPath = path.join(contextDir, `${slugify(site.domain)}.md`);

  let extraContext = "";
  if (fs.existsSync(contextPath)) {
    extraContext = fs.readFileSync(contextPath, "utf-8");
    console.log(`\nLoaded site context from: content-plans/context/${slugify(site.domain)}.md`);
  } else {
    console.log(`\nNo context file found. Creating one at: content-plans/context/${slugify(site.domain)}.md`);
    console.log("Edit this file to add brand notes, target audience details, competitor info, etc.");
    fs.writeFileSync(contextPath, `# Site Context — ${site.name} (${site.domain})
<!-- Edit this file to give the AI richer context about this site. -->
<!-- It will be included in every content calendar run for this site. -->

## About the Site


## Target Audience


## Competitors


## Content Pillars / Topic Areas


## Tone & Style Notes


## Things to Avoid


## Internal Pages to Link To (important URLs)

`);
  }

  rl.close();

  // 2. Load existing articles
  const existing = await sql`
    SELECT title, keyword, status, category FROM "Article"
    WHERE "siteId" = ${site.id} ORDER BY "createdAt" DESC
  `;
  const covered = existing.length
    ? existing.map(a => `- ${a.title} [${a.keyword}] (${a.status})`).join("\n")
    : "None yet.";

  hr();
  console.log(`Site: ${site.name} (${site.domain})`);
  console.log(`Existing articles: ${existing.length}`);
  console.log(`Generating: ${months}-month calendar from ${startFrom}`);
  hr();
  console.log("⏳ Running research and building calendar...\n");

  // 3. Build prompt
  const siteContext = [
    `Site: ${site.name}`,
    `Domain: ${site.domain}`,
    site.description && `Description: ${site.description}`,
    site.brandVoice && `Brand voice: ${site.brandVoice}`,
    site.tone && `Tone: ${site.tone}`,
    site.targetAudience && `Target audience: ${site.targetAudience}`,
  ].filter(Boolean).join("\n");

  const prompt = `
You are an expert SEO content strategist. Generate a ${months}-month content calendar starting ${startFrom} for this site.

${siteContext}
${extraContext ? `\n## Additional Site Context\n${extraContext}` : ""}

Already published or planned (do NOT repeat these):
${covered}

---

Output the following sections in order, using exactly these headings:

## Keyword Research

List the 20 best keyword opportunities. For each:
| Keyword | Monthly Searches (UK) | Competition | Intent | Fit |
Include a brief "Fit" note explaining why this suits the site.

## Content Calendar

One post per week for ${months} months. Use this table format:

| Week | Date | Title | Keyword | Type | Words | Priority |
|------|------|-------|---------|------|-------|----------|

After the table, for each post include a brief entry:
**[Title]**
- Hook: (one sentence — what makes this better than current top results?)
- Secondary keywords:
- Internal links: (suggest 2-3 relevant pages/posts on the site)

## Quick Wins

List the 5 posts to publish first. Explain why (low competition, high intent match, etc.).

## Planned Articles

Output this JSON block and nothing after it:

\`\`\`json
[
  {
    "title": "...",
    "keyword": "...",
    "category": "..."
  }
]
\`\`\`
`.trim();

  const system = `You are an expert SEO content strategist specialising in the UK market.
Always use British English. Never use em dashes. Be specific with data where possible.
Follow the output format exactly — the JSON block at the end will be parsed programmatically.`;

  const output = await stream(prompt, system);

  // 4. Save markdown with consistent header
  const timestamp = new Date().toISOString().split("T")[0];
  const safeSlug = slugify(site.domain);
  const filename = `${safeSlug}-${timestamp}.md`;
  const outDir = path.join(__dirname, "../content-plans");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const markdown = `---
site: ${site.name}
domain: ${site.domain}
generated: ${timestamp}
months: ${months}
startFrom: ${startFrom}
existingArticles: ${existing.length}
---

# Content Calendar — ${site.name}
**Generated:** ${timestamp} | **Period:** ${months} months from ${startFrom}

---

${output}
`;

  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, markdown);
  console.log(`\n✅ Saved: content-plans/${filename}`);

  // 5. Parse JSON and add planned articles to DB
  const jsonMatch = output.match(/```json\n([\s\S]*?)\n```\s*$/);
  if (!jsonMatch) {
    console.log("⚠️  Could not find JSON block — articles not added to DB. Check the markdown file.");
    process.exit(0);
  }

  let articles;
  try {
    articles = JSON.parse(jsonMatch[1]);
  } catch (e) {
    console.log("⚠️  JSON parse error:", e.message);
    process.exit(0);
  }

  let added = 0, skipped = 0;
  for (const a of articles) {
    const slug = slugify(a.title);
    const exists = await sql`SELECT id FROM "Article" WHERE "siteId" = ${site.id} AND slug = ${slug} LIMIT 1`;
    if (exists.length) { skipped++; continue; }
    await sql`
      INSERT INTO "Article" (id, "siteId", title, slug, keyword, category, status, "contentType", "createdAt", "updatedAt")
      VALUES (
        ${randomId()}, ${site.id}, ${a.title}, ${slug}, ${a.keyword},
        ${a.category ?? null}, 'planned', 'post', NOW(), NOW()
      )
    `;
    added++;
  }

  console.log(`✅ Added ${added} planned articles to Content Hub${skipped ? ` (${skipped} skipped — already exist)` : ""}.`);
  console.log("\nDone.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
