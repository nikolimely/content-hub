require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const sql = neon(process.env.DATABASE_URL);
const PEXELS_KEY = 'qYk85t2RLFqdEWXEIIIjBDuvE2skW6bmPSPG6RO11GMAFSu7Qi80ZZvP';

const sites = {
  propertywave: {
    path: '/Users/moustoukas/Documents/Websites/propertywave',
    imageDir: 'public/images/blog',
    articles: [
      { slug: 'how-to-get-more-valuation-enquiries', title: 'How to Get More Valuation Enquiries from Your Estate Agent Website', date: '2026-04-14', image: 'valuation-enquiries.jpg', query: 'estate agent office property valuation' },
      { slug: 'estate-agent-seo-how-to-rank-locally', title: 'Estate Agent SEO: How to Rank Locally Without Paid Ads', date: '2026-04-15', image: 'estate-agent-seo.jpg', query: 'local search google map laptop business' },
      { slug: 'what-makes-a-great-estate-agent-homepage', title: 'What Makes a Great Estate Agent Homepage in 2026', date: '2026-04-16', image: 'estate-agent-homepage.jpg', query: 'modern website design laptop property' },
      { slug: 'why-most-estate-agent-websites-fail-at-lead-generation', title: 'Why Most Estate Agent Websites Fail at Lead Generation', date: '2026-04-17', image: 'estate-agent-lead-generation.jpg', query: 'property enquiry online form laptop' },
      { slug: 'how-to-write-property-descriptions-that-convert', title: 'How to Write Property Descriptions That Convert Browsers into Buyers', date: '2026-04-20', image: 'property-descriptions.jpg', query: 'estate agent writing desk property listing' },
      { slug: 'the-case-for-a-dedicated-letting-agent-website', title: 'The Case for a Dedicated Letting Agent Website', date: '2026-04-21', image: 'letting-agent-website.jpg', query: 'letting agent keys property rental' },
      { slug: 'how-page-speed-affects-property-website-enquiries', title: 'How Page Speed Affects Property Website Enquiries', date: '2026-04-22', image: 'page-speed-property.jpg', query: 'website speed mobile phone loading' },
      { slug: 'social-proof-for-estate-agents', title: 'Social Proof for Estate Agents: Using Reviews to Win More Instructions', date: '2026-04-23', image: 'estate-agent-reviews.jpg', query: 'five star review rating customer feedback' },
      { slug: 'how-to-build-a-property-website-for-landlords', title: 'How to Build a Property Website That Works for Landlords', date: '2026-04-24', image: 'landlord-property-website.jpg', query: 'landlord property keys rental building' },
      { slug: 'the-role-of-photography-in-estate-agent-website-conversions', title: 'The Role of Photography in Estate Agent Website Conversions', date: '2026-04-27', image: 'property-photography.jpg', query: 'professional property photography interior bright' },
      { slug: 'google-business-profile-for-estate-agents', title: 'Google Business Profile for Estate Agents: A Complete Setup Guide', date: '2026-04-28', image: 'google-business-profile.jpg', query: 'google maps local business search results' },
      { slug: 'how-commercial-property-agents-can-stand-out-online', title: 'How Commercial Property Agents Can Stand Out Online', date: '2026-04-29', image: 'commercial-property-website.jpg', query: 'commercial office building property exterior' },
      { slug: 'crm-integrations-for-estate-agent-websites', title: 'The Best CRM Integrations for Estate Agent Websites in 2026', date: '2026-04-30', image: 'estate-agent-crm.jpg', query: 'crm software dashboard property management' },
    ],
  },
  'sutton-commerce': {
    path: '/Users/moustoukas/Documents/Websites/sutton-commerce',
    imageDir: 'public/blog/images',
    articles: [
      { slug: 'how-to-reduce-cart-abandonment-shopify', title: 'How to Reduce Cart Abandonment on Your Shopify Store', date: '2026-04-14', image: 'cart-abandonment-shopify.jpg', query: 'shopping cart online ecommerce checkout' },
      { slug: 'shopify-vs-shopify-plus-when-to-upgrade', title: 'Shopify vs Shopify Plus: When to Upgrade', date: '2026-04-15', image: 'shopify-vs-shopify-plus.jpg', query: 'ecommerce platform upgrade growth business' },
      { slug: 'how-to-improve-shopify-mobile-conversion-rate', title: 'How to Improve Your Shopify Store\'s Mobile Conversion Rate', date: '2026-04-16', image: 'shopify-mobile-conversion.jpg', query: 'mobile phone shopping ecommerce app' },
      { slug: 'shopify-product-page-optimisation-guide', title: 'The Complete Guide to Shopify Product Page Optimisation', date: '2026-04-17', image: 'shopify-product-page.jpg', query: 'product photography ecommerce online store' },
      { slug: 'shopify-email-marketing-repeat-purchases', title: 'How to Use Email Marketing to Drive Repeat Purchases on Shopify', date: '2026-04-20', image: 'shopify-email-marketing.jpg', query: 'email marketing campaign newsletter digital' },
      { slug: 'shopify-core-web-vitals-speed-optimisation', title: 'Shopify Speed Optimisation: How to Improve Core Web Vitals', date: '2026-04-21', image: 'shopify-core-web-vitals.jpg', query: 'website performance speed loading bar' },
      { slug: 'how-to-set-up-shopify-analytics', title: 'How to Set Up Shopify Analytics the Right Way', date: '2026-04-22', image: 'shopify-analytics.jpg', query: 'analytics dashboard charts data metrics' },
      { slug: 'common-shopify-design-mistakes', title: 'The Most Common Shopify Design Mistakes and How to Fix Them', date: '2026-04-23', image: 'shopify-design-mistakes.jpg', query: 'web design ux interface laptop design' },
      { slug: 'how-to-build-high-converting-shopify-landing-page', title: 'How to Build a High-Converting Shopify Landing Page', date: '2026-04-24', image: 'shopify-landing-page.jpg', query: 'landing page conversion digital marketing' },
      { slug: 'shopify-subscriptions-recurring-revenue', title: 'Shopify Subscriptions: How to Build Recurring Revenue', date: '2026-04-27', image: 'shopify-subscriptions.jpg', query: 'subscription box recurring ecommerce delivery' },
      { slug: 'how-to-use-social-proof-to-increase-shopify-conversions', title: 'How to Use Social Proof to Increase Shopify Conversions', date: '2026-04-28', image: 'social-proof-shopify.jpg', query: 'customer reviews stars rating trust' },
      { slug: 'international-ecommerce-selling-globally-shopify', title: 'International Ecommerce: How to Sell Globally on Shopify', date: '2026-04-29', image: 'shopify-international-ecommerce.jpg', query: 'global ecommerce world map shipping' },
      { slug: 'shopify-checkout-customisation-2026', title: 'Shopify Checkout Customisation: What\'s Possible in 2026', date: '2026-04-30', image: 'shopify-checkout-2026.jpg', query: 'checkout payment online shopping card' },
    ],
  },
};

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

async function addSite(name, domain) {
  const rows = await sql`SELECT id FROM "Site" WHERE domain = ${domain}`;
  if (rows.length) {
    console.log(`  Site exists: ${domain} (${rows[0].id})`);
    return rows[0].id;
  }
  const slug = domain.replace(/\./g, '-');
  const result = await sql`
    INSERT INTO "Site" (id, name, slug, domain, "githubRepo", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${name}, ${slug}, ${domain}, ${domain}, NOW(), NOW())
    RETURNING id
  `;
  console.log(`  Created site: ${domain} (${result[0].id})`);
  return result[0].id;
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
  // PropertyWave
  console.log('\n=== PropertyWave ===');
  const pwId = await addSite('PropertyWave', 'propertywave.co.uk');
  const pwSite = sites.propertywave;
  for (const a of pwSite.articles) {
    console.log(`[${a.date}] ${a.slug}`);
    const dest = path.join(pwSite.path, pwSite.imageDir, a.image);
    if (!fs.existsSync(dest)) {
      try {
        const url = await fetchPexels(a.query);
        await downloadAndResize(url, dest);
        console.log(`  image saved`);
      } catch(e) { console.warn(`  image failed: ${e.message}`); }
    } else { console.log(`  image exists`); }
    await upsertArticle(pwId, a);
    console.log(`  DB done`);
  }
  console.log('Committing PropertyWave...');
  execSync('git add -A && git diff --cached --quiet || git commit -m "content: add April 2026 scheduled posts"', { cwd: pwSite.path, stdio: 'inherit' });
  execSync('git push origin main', { cwd: pwSite.path, stdio: 'inherit' });

  // SuttonCommerce
  console.log('\n=== SuttonCommerce ===');
  const scId = await addSite('SuttonCommerce', 'suttoncommerce.co.uk');
  const scSite = sites['sutton-commerce'];
  for (const a of scSite.articles) {
    console.log(`[${a.date}] ${a.slug}`);
    const dest = path.join(scSite.path, scSite.imageDir, a.image);
    if (!fs.existsSync(dest)) {
      try {
        const url = await fetchPexels(a.query);
        await downloadAndResize(url, dest);
        console.log(`  image saved`);
      } catch(e) { console.warn(`  image failed: ${e.message}`); }
    } else { console.log(`  image exists`); }
    await upsertArticle(scId, a);
    console.log(`  DB done`);
  }
  console.log('Committing SuttonCommerce...');
  execSync('git add -A && git diff --cached --quiet || git commit -m "content: add April 2026 scheduled posts"', { cwd: scSite.path, stdio: 'inherit' });
  execSync('git push origin main', { cwd: scSite.path, stdio: 'inherit' });

  console.log('\nAll done.');
}

main().catch(console.error);
