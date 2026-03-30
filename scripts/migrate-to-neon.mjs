import Database from "better-sqlite3";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import { config } from "dotenv";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../prisma/dev.db");

// Dynamically import Prisma with Neon adapter
const require = createRequire(import.meta.url);

async function main() {
  // Read from SQLite
  const sqlite = new Database(dbPath);

  const sites = sqlite.prepare("SELECT * FROM Site").all();
  const authors = sqlite.prepare("SELECT * FROM Author").all();
  const articles = sqlite.prepare("SELECT * FROM Article").all();

  sqlite.close();

  console.log(`Found: ${sites.length} sites, ${authors.length} authors, ${articles.length} articles`);

  // Connect to Neon
  const { Pool } = await import("@neondatabase/serverless");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Insert sites
  for (const site of sites) {
    await pool.query(
      `INSERT INTO "Site" (id, name, slug, domain, "githubRepo", "repoBranch", "contentPath", "contentTypes", "assetsPath", "imageWidth", "imageHeight", description, logo, "faviconUrl", model, "brandVoice", tone, "targetAudience", "externalLinksPath", "authorsPath", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       ON CONFLICT (id) DO NOTHING`,
      [site.id, site.name, site.slug, site.domain, site.githubRepo, site.repoBranch, site.contentPath,
       site.contentTypes, site.assetsPath, site.imageWidth, site.imageHeight, site.description,
       site.logo, site.faviconUrl, site.model, site.brandVoice, site.tone, site.targetAudience,
       site.externalLinksPath, site.authorsPath, site.createdAt, site.updatedAt]
    );
  }
  console.log(`✓ Inserted ${sites.length} site(s)`);

  // Insert authors
  for (const author of authors) {
    await pool.query(
      `INSERT INTO "Author" (id, "siteId", name, slug, bio, avatar)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO NOTHING`,
      [author.id, author.siteId, author.name, author.slug, author.bio, author.avatar]
    );
  }
  console.log(`✓ Inserted ${authors.length} author(s)`);

  // Insert articles in batches
  let count = 0;
  for (const article of articles) {
    await pool.query(
      `INSERT INTO "Article" (id, "siteId", "authorId", title, slug, keyword, category, "contentType", "metaDescription", status, content, "heroImage", images, "scheduledAt", "publishedAt", "errorLog", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (id) DO NOTHING`,
      [article.id, article.siteId, article.authorId, article.title, article.slug, article.keyword,
       article.category, article.contentType, article.metaDescription, article.status, article.content,
       article.heroImage, article.images, article.scheduledAt, article.publishedAt, article.errorLog,
       article.createdAt, article.updatedAt]
    );
    count++;
    if (count % 25 === 0) process.stdout.write(`  ${count}/${articles.length} articles...\r`);
  }
  console.log(`✓ Inserted ${articles.length} article(s)          `);

  await pool.end();
  console.log("Done!");
}

main().catch((e) => { console.error(e); process.exit(1); });
