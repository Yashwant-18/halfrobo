/**
 * ═══════════════════════════════════════════════════════════════
 *  WooCommerce XML → PostgreSQL Importer
 *  File: server/import-woo.js
 *
 *  Usage:
 *    node import-woo.js <path-to-your-xml-file>
 *
 *  Example:
 *    node import-woo.js ./halfrobo-products.xml
 *
 *  Supports:
 *    - WordPress WooCommerce full site export (wp:post_type = product)
 *    - WooCommerce CSV-XML export plugin
 *    - Standard WooCommerce REST API XML export
 * ═══════════════════════════════════════════════════════════════
 */

import dotenv from 'dotenv';
dotenv.config();

import fs   from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── DB connection ─────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// ── Helpers ───────────────────────────────────────────────────
const slugify = (str = '') =>
  str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);

const clean = (v) => (v === undefined || v === null || v === '') ? null : String(v).trim();

const toFloat = (v) => {
  const n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
};

const toInt = (v) => {
  const n = parseInt(String(v || ''));
  return isNaN(n) ? 0 : n;
};

// Extract meta value from WooCommerce postmeta array
const getMeta = (metas, key) => {
  if (!Array.isArray(metas)) metas = [metas];
  const found = metas.find(m => m?.['wp:meta_key'] === key);
  return found ? clean(found['wp:meta_value']) : null;
};

// ── Main ──────────────────────────────────────────────────────
async function main() {
  const xmlFile = process.argv[2];

  if (!xmlFile) {
    console.error('\n❌  Usage: node import-woo.js <path-to-xml-file>\n');
    console.error('   Example: node import-woo.js ./halfrobo-products.xml\n');
    process.exit(1);
  }

  const filePath = path.resolve(xmlFile);
  if (!fs.existsSync(filePath)) {
    console.error(`\n❌  File not found: ${filePath}\n`);
    process.exit(1);
  }

  console.log(`\n📂  Reading XML file: ${filePath}`);
  const xml = fs.readFileSync(filePath, 'utf8');
  console.log(`    File size: ${(xml.length / 1024).toFixed(1)} KB`);

  // ── Parse XML ───────────────────────────────────────────────
  console.log('\n🔍  Parsing XML...');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    isArray: (name) => ['item', 'wp:postmeta', 'category'].includes(name),
    parseTagValue: false,
  });

  let parsed;
  try {
    parsed = parser.parse(xml);
  } catch (e) {
    console.error(`\n❌  XML parse error: ${e.message}`);
    process.exit(1);
  }

  // WooCommerce export wraps everything in rss > channel > item
  const channel = parsed?.rss?.channel;
  if (!channel) {
    console.error('\n❌  Could not find <rss><channel> in XML. Make sure this is a WordPress export file.');
    process.exit(1);
  }

  const items = channel.item || [];
  const products = items.filter(item =>
    item['wp:post_type'] === 'product' &&
    item['wp:status'] === 'publish'
  );

  if (products.length === 0) {
    console.warn('\n⚠️   No published products found in XML.');
    console.warn('     Expected: <wp:post_type>product</wp:post_type>');
    console.warn('     and:      <wp:status>publish</wp:status>\n');
    process.exit(0);
  }

  console.log(`\n✅  Found ${products.length} published products\n`);

  // ── Ensure tables exist ──────────────────────────────────────
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      short_description TEXT,
      specifications JSONB DEFAULT '{}',
      price DECIMAL(10,2) NOT NULL,
      discount_price DECIMAL(10,2),
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      images JSONB DEFAULT '[]',
      stock INTEGER DEFAULT 0,
      sku VARCHAR(100),
      brand VARCHAR(255),
      gtin VARCHAR(100),
      tags JSONB DEFAULT '[]',
      is_featured BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      rating DECIMAL(3,2) DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // ── Category cache ───────────────────────────────────────────
  const catCache = {}; // slug → uuid

  const getOrCreateCategory = async (name) => {
    if (!name) return null;
    const slug = slugify(name);
    if (catCache[slug]) return catCache[slug];

    // check DB
    const existing = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existing.rows.length) {
      catCache[slug] = existing.rows[0].id;
      return catCache[slug];
    }

    // insert new
    const inserted = await pool.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name=$1 RETURNING id',
      [name.trim(), slug]
    );
    catCache[slug] = inserted.rows[0].id;
    console.log(`  📁  Created category: ${name}`);
    return catCache[slug];
  };

  // ── Import products ──────────────────────────────────────────
  let created = 0, skipped = 0, errors = 0;

  for (const item of products) {
    try {
      const name  = clean(item['title']);
      if (!name) { skipped++; continue; }

      const rawSlug = clean(item['wp:post_name']) || slugify(name);
      const slug    = rawSlug || slugify(name);

      const metas   = item['wp:postmeta'] || [];
      const regularPrice  = toFloat(getMeta(metas, '_regular_price') || getMeta(metas, '_price'));
      const salePrice     = toFloat(getMeta(metas, '_sale_price'));
      const stockQty      = toInt(getMeta(metas, '_stock') || getMeta(metas, '_stock_quantity'));
      const sku           = clean(getMeta(metas, '_sku'));
      const brand         = clean(getMeta(metas, '_brand') || getMeta(metas, 'brand'));
      const gtin          = clean(getMeta(metas, '_gtin') || getMeta(metas, '_global_unique_id'));
      const isFeatured    = getMeta(metas, '_featured') === 'yes';

      // Price fallback: if no price, skip (required field)
      if (!regularPrice) {
        console.warn(`  ⚠️  Skipping "${name}" — no price found`);
        skipped++; continue;
      }

      // Description
      const description      = clean(item['content:encoded'] || item['description']);
      const shortDescription = clean(item['excerpt:encoded']);

      // Categories — WooCommerce exports as <category domain="product_cat">
      let categoryId = null;
      const cats = item['category'];
      if (cats && cats.length > 0) {
        const productCat = cats.find(c => c['@_domain'] === 'product_cat');
        if (productCat) {
          const catName = productCat['#text'] || clean(productCat);
          categoryId = await getOrCreateCategory(catName);
        }
      }

      // Tags
      const tagItems = (cats || []).filter(c => c['@_domain'] === 'product_tag');
      const tags = tagItems.map(t => (t['#text'] || '').trim()).filter(Boolean);

      // Images — WooCommerce stores thumbnail in meta _thumbnail_id, but URL in wp:attachment_url
      // For import we'll store a placeholder; images can be updated in Admin later
      const imageUrl = clean(getMeta(metas, '_thumbnail_src') || getMeta(metas, 'image'));
      const images = imageUrl ? [imageUrl] : [];

      // Upsert product
      const result = await pool.query(`
        INSERT INTO products
          (name, slug, description, short_description, price, discount_price,
           stock, sku, brand, gtin, category_id, images, tags, is_featured, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)
        ON CONFLICT (slug) DO UPDATE SET
          name             = EXCLUDED.name,
          description      = EXCLUDED.description,
          short_description= EXCLUDED.short_description,
          price            = EXCLUDED.price,
          discount_price   = EXCLUDED.discount_price,
          stock            = EXCLUDED.stock,
          sku              = EXCLUDED.sku,
          brand            = EXCLUDED.brand,
          gtin             = EXCLUDED.gtin,
          category_id      = EXCLUDED.category_id,
          images           = EXCLUDED.images,
          tags             = EXCLUDED.tags,
          is_featured      = EXCLUDED.is_featured,
          updated_at       = NOW()
        RETURNING id, (xmax = 0) AS inserted
      `, [
        name, slug, description, shortDescription,
        regularPrice, salePrice,
        stockQty, sku, brand, gtin,
        categoryId,
        JSON.stringify(images),
        JSON.stringify(tags),
        isFeatured,
      ]);

      const wasInserted = result.rows[0]?.inserted;
      created++;
      console.log(`  ${wasInserted ? '✅' : '🔄'}  ${wasInserted ? 'Imported' : 'Updated '}: ${name} — ₹${regularPrice}${salePrice ? ` (sale: ₹${salePrice})` : ''}`);

    } catch (err) {
      errors++;
      console.error(`  ❌  Error on "${item?.title}": ${err.message}`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('  IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════');
  console.log(`  ✅  Imported/Updated : ${created}`);
  console.log(`  ⚠️   Skipped          : ${skipped}`);
  console.log(`  ❌  Errors           : ${errors}`);
  console.log(`  📁  Categories created in DB`);
  console.log('═══════════════════════════════════════════\n');

  await pool.end();
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
