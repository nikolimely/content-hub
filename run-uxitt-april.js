require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const sql = neon(process.env.DATABASE_URL);
const PEXELS_KEY = 'qYk85t2RLFqdEWXEIIIjBDuvE2skW6bmPSPG6RO11GMAFSu7Qi80ZZvP';

const SITE_PATH = '/Users/moustoukas/Documents/Websites/uxittt';
const IMAGE_DIR = 'public/images/blog';
const SITE_DOMAIN = 'uxitt.com';

const articles = [
  { slug: 'what-is-a-ux-audit', title: 'What Is a UX Audit? A Plain-English Guide for Shopify Store Owners', date: '2026-04-14', image: 'what-is-a-ux-audit.jpg', query: 'UX design review laptop wireframe' },
  { slug: 'shopify-colour-psychology', title: 'The Psychology of Colour in Shopify Store Design', date: '2026-04-15', image: 'shopify-colour-psychology.jpg', query: 'colour palette design swatches branding' },
  { slug: 'shopify-site-search-ux', title: 'Shopify Site Search UX: Why Poor Search Is Costing You Sales', date: '2026-04-16', image: 'shopify-site-search-ux.jpg', query: 'search bar website ecommerce laptop' },
  { slug: 'ecommerce-copywriting-ux', title: 'Ecommerce Copywriting and UX: Why Your Words Are a Design Problem', date: '2026-04-17', image: 'ecommerce-copywriting-ux.jpg', query: 'copywriting writing desk laptop creative' },
  { slug: 'shopify-product-image-ux', title: 'Shopify Product Image UX: The Visual Mistakes That Kill Conversions', date: '2026-04-20', image: 'shopify-product-image-ux.jpg', query: 'product photography studio ecommerce shoot' },
  { slug: 'white-space-ecommerce-ux', title: 'White Space in Ecommerce UX: Why Less Is More for Shopify Conversions', date: '2026-04-21', image: 'white-space-ecommerce-ux.jpg', query: 'clean minimal website design desktop' },
  { slug: 'shopify-popup-ux', title: 'Pop-Up UX on Shopify: When They Work and When They Hurt', date: '2026-04-22', image: 'shopify-popup-ux.jpg', query: 'website popup notification laptop screen' },
  { slug: 'shopify-footer-ux', title: 'Shopify Footer UX: Why Your Footer Matters More Than You Think', date: '2026-04-23', image: 'shopify-footer-ux.jpg', query: 'website design footer layout screen' },
  { slug: 'shopify-sale-page-ux', title: 'How to Design a High-Converting Shopify Sale Page', date: '2026-04-24', image: 'shopify-sale-page-ux.jpg', query: 'sale shopping online discount ecommerce' },
  { slug: 'ux-principles-shopify-owners', title: '5 UX Principles Every Shopify Store Owner Should Understand', date: '2026-04-27', image: 'ux-principles-shopify-owners.jpg', query: 'UX principles design thinking whiteboard' },
  { slug: 'shopify-cart-ux', title: 'Shopify Cart UX: The Small Changes That Reduce Abandonment', date: '2026-04-28', image: 'shopify-cart-ux.jpg', query: 'shopping cart ecommerce online checkout mobile' },
  { slug: 'typography-shopify-conversions', title: 'Typography and Shopify Conversions: What Your Fonts Are Saying About Your Brand', date: '2026-04-29', image: 'typography-shopify-conversions.jpg', query: 'typography fonts design branding creative' },
  { slug: 'diy-shopify-ux-testing', title: 'How to Test Your Shopify Store\'s UX Without a Designer', date: '2026-04-30', image: 'diy-shopify-ux-testing.jpg', query: 'usability testing laptop team user research' },
];

function fetchPexels(query) {
  return new Promise((resolve, reject) => {
    const q = encodeURIComponent(query);
    const opts = {
      hostname: 'api.pexels.com',
      path: `/v1/search?query=${q}&per_page=5&orientation=landscape`,
      headers: { Authorization: PEXELS_KEY },
    };
    https.get(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const photos = json.photos || [];
          if (!photos.length) return reject(new Error(`No results: ${query}`));
          const photo = photos[Math.floor(Math.random() * Math.min(3, photos.length))];
          resolve(photo.src.large2x || photo.src.original);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadAndResize(url, destPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadAndResize(res.headers.location, destPath).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        sharp(Buffer.concat(chunks))
          .resize(1200, 800, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 82 })
          .toFile(destPath, (err) => { if (err) reject(err); else resolve(); });
      });
    }).on('error', reject);
  });
}

async function upsertArticle(siteId, article) {
  const scheduledAt = new Date(article.date + 'T09:00:00.000Z');
  await sql`
    INSERT INTO "Article" (id, "siteId", title, slug, keyword, status, "scheduledAt", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${siteId}, ${article.title}, ${article.slug}, ${article.slug}, 'published', ${scheduledAt}, NOW(), NOW())
    ON CONFLICT (slug, "siteId") DO UPDATE SET
      title = EXCLUDED.title, status = EXCLUDED.status,
      "scheduledAt" = EXCLUDED."scheduledAt", "updatedAt" = NOW()
  `;
}

async function main() {
  const rows = await sql`SELECT id FROM "Site" WHERE domain = ${SITE_DOMAIN}`;
  if (!rows.length) { console.error('Site not found in DB'); process.exit(1); }
  const siteId = rows[0].id;
  console.log(`Site ID: ${siteId}`);

  for (const a of articles) {
    console.log(`[${a.date}] ${a.slug}`);
    const dest = path.join(SITE_PATH, IMAGE_DIR, a.image);
    if (!fs.existsSync(dest)) {
      try {
        const url = await fetchPexels(a.query);
        await downloadAndResize(url, dest);
        console.log(`  image saved`);
      } catch(e) { console.warn(`  image failed: ${e.message}`); }
    } else { console.log(`  image exists`); }
    await upsertArticle(siteId, a);
    console.log(`  DB done`);
  }

  console.log('Committing and pushing...');
  execSync('git add -A && git diff --cached --quiet || git commit -m "content: add April 2026 scheduled posts"', { cwd: SITE_PATH, stdio: 'inherit' });
  execSync('git push origin main', { cwd: SITE_PATH, stdio: 'inherit' });
  console.log('All done.');
}

main().catch(console.error);
