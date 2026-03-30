import { config } from "dotenv";
config();

const { Pool } = await import("@neondatabase/serverless");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sites = await pool.query('SELECT id, name, slug FROM "Site"');
const articles = await pool.query('SELECT COUNT(*) FROM "Article"');
console.log("Sites:", sites.rows);
console.log("Article count:", articles.rows[0].count);
await pool.end();
