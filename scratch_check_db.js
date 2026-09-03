const { Client } = require('pg');

async function main() {
  const connectionString = 'postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@junction.proxy.rlwy.net:47577/railway';
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== Checking Product & Variants matching 890351069409 or COL1-XL ===');
  const v1 = await client.query(`SELECT id, "productId", sku, barcode, title, status, "isActive", "deletedAt" FROM product_variants WHERE barcode = '890351069409' OR sku = 'COL1-XL'`);
  console.log('Variants matching barcode or SKU:', v1.rows);

  const p1 = await client.query(`SELECT id, name, sku, barcode, channel, status, visibility, "deletedAt" FROM products WHERE id IN (SELECT "productId" FROM product_variants WHERE barcode = '890351069409' OR sku = 'COL1-XL')`);
  console.log('Parent Products:', p1.rows);

  console.log('\n=== Checking ALL Variants for Floral Printed Anarkali Dress ===');
  const allV = await client.query(`SELECT id, sku, barcode, title, status, "isActive", "deletedAt" FROM product_variants WHERE "productId" = '7a1a81cf-fa83-451b-af36-c1f60e5b599c'`);
  console.log(allV.rows);

  await client.end();
}

main().catch(console.error);
