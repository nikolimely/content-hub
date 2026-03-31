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

async function ask(question, fallback = "") {
  const answer = await rl.question(question);
  return answer.trim() || fallback;
}

async function main() {
  // Support CLI args: node content-calendar.mjs [siteNumber] [months] [startFrom]
  const args = process.argv.slice(2);

  console.log("\n🗓  Content Calendar Generator\n");

  // 1. Load sites
  const sites = await sql`SELECT id, name, domain, "githubRepo", "repoBranch", "brandVoice", tone, "targetAudience", description, "sitemapUrl" FROM "Site" ORDER BY name`;
  if (!sites.length) { console.log("No sites found."); process.exit(1); }

  console.log("Sites:\n");
  sites.forEach((s, i) => console.log(`  ${i + 1}. ${s.name} (${s.domain})`));

  const pick = args[0] ?? await ask("\nChoose a site (number): ");
  const site = sites[parseInt(pick, 10) - 1];
  if (!site) { console.log("Invalid selection."); process.exit(1); }

  const months = args[1] ?? await ask("How many months? (default: 3): ", "3");
  const startFrom = args[2] ?? await ask("Start from (e.g. April 2026): ", "next month");

  // Load or create site context file
  const contextDir = path.join(__dirname, "../content-plans/context");
  if (!fs.existsSync(contextDir)) fs.mkdirSync(contextDir, { recursive: true });
  const contextPath = path.join(contextDir, `${slugify(site.domain)}.md`);

  let extraContext = "";
  let cadence = "1 post per week";
  if (fs.existsSync(contextPath)) {
    extraContext = fs.readFileSync(contextPath, "utf-8");
    const cadenceMatch = extraContext.match(/^cadence:\s*(.+)$/m);
    if (cadenceMatch) cadence = cadenceMatch[1].trim();
    console.log(`\nLoaded site context from: content-plans/context/${slugify(site.domain)}.md`);
    console.log(`Publishing cadence: ${cadence}`);
  } else {
    console.log(`\nNo context file found. Creating one at: content-plans/context/${slugify(site.domain)}.md`);
    console.log("Edit this file to configure cadence, brand notes, competitors, etc.");
    fs.writeFileSync(contextPath, `# Site Context — ${site.name} (${site.domain})
# Edit this file to give the AI richer context. It is read on every calendar run.

## Config
cadence: 1 post per week
# Examples: "1 post per working day", "3 posts per week", "2 posts per week", "4 posts per month"

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

  // 1b. Fetch sitemap URLs if configured
  let sitemapUrls = "";
  if (site.sitemapUrl) {
    try {
      console.log(`\nFetching sitemap: ${site.sitemapUrl}`);
      const res = await fetch(site.sitemapUrl);
      const xml = await res.text();
      const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
      if (urls.length) {
        sitemapUrls = urls.join("\n");
        console.log(`Found ${urls.length} URLs in sitemap.`);
      }
    } catch (e) {
      console.log(`⚠️  Could not fetch sitemap: ${e.message}`);
    }
  }

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
  console.log(`Generating: ${months}-month calendar from ${startFrom} (${cadence})`);
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

${sitemapUrls ? `## Live Site Pages (use these for internal link suggestions)\n${sitemapUrls}\n\n` : ""}Already published or planned (do NOT repeat these):
${covered}

---

Output the following sections in order, using exactly these headings:

## Keyword Research

List the 20 best keyword opportunities. For each:
| Keyword | Monthly Searches (UK) | Competition | Intent | Fit |
Include a brief "Fit" note explaining why this suits the site.

## Content Calendar

Publishing cadence: **${cadence}**. Plan all posts for ${months} months at this cadence. Use this table format:

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

Output this JSON block and nothing after it. Use the planned publish date from the calendar table above (ISO format YYYY-MM-DD):

\`\`\`json
[
  {
    "title": "...",
    "keyword": "...",
    "category": "...",
    "date": "YYYY-MM-DD"
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
cadence: ${cadence}
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
    const scheduledAt = a.date ? new Date(a.date).toISOString() : null;
    await sql`
      INSERT INTO "Article" (id, "siteId", title, slug, keyword, category, status, "contentType", "scheduledAt", "createdAt", "updatedAt")
      VALUES (
        ${randomId()}, ${site.id}, ${a.title}, ${slug}, ${a.keyword},
        ${a.category ?? null}, 'planned', 'post', ${scheduledAt}, NOW(), NOW()
      )
    `;
    added++;
  }

  console.log(`✅ Added ${added} planned articles to Content Hub${skipped ? ` (${skipped} skipped — already exist)` : ""}.`);

  // 7. Commit markdown to the site's GitHub repo
  if (site.githubRepo && process.env.GITHUB_TOKEN) {
    const branch = site.repoBranch || "main";
    const repoPath = `content-plans/${filename}`;
    const apiUrl = `https://api.github.com/repos/${site.githubRepo}/contents/${repoPath}`;
    const encoded = Buffer.from(markdown).toString("base64");

    // Check if file already exists (need its SHA to update)
    let sha;
    const existing = await fetch(apiUrl, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
    });
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }

    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `content: add ${months}-month content calendar from ${startFrom}`,
        content: encoded,
        branch,
        ...(sha && { sha }),
      }),
    });

    if (res.ok) {
      console.log(`✅ Committed to ${site.githubRepo}: ${repoPath}`);
    } else {
      const err = await res.json();
      console.log(`⚠️  GitHub commit failed: ${err.message}`);
    }
  } else if (!site.githubRepo) {
    console.log("⚠️  No GitHub repo set for this site — skipping commit.");
  } else {
    console.log("⚠️  GITHUB_TOKEN not set — skipping commit.");
  }

  console.log("\nDone.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
