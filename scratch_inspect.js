const { Client } = require('pg');

async function main() {
  const connectionString = 'postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@junction.proxy.rlwy.net:47577/railway';
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== ALL PRODUCTS IN DB ===');
  const prods = await client.query('SELECT id, name, sku, barcode, channel, status, visibility, "deletedAt" FROM products');
  console.log(prods.rows);

  console.log('\n=== ALL VARIANTS IN DB ===');
  const vars = await client.query('SELECT id, "productId", sku, barcode, title, status, "isActive", "deletedAt" FROM product_variants');
  console.log(vars.rows);

  console.log('\n=== ENSURING ALL PRODUCTS & VARIANTS ARE ACTIVE & STORE SELLABLE ===');
  await client.query(`UPDATE products SET channel = 'BOTH', status = 'ACTIVE', visibility = 'VISIBLE', "deletedAt" = NULL`);
  await client.query(`UPDATE product_variants SET status = 'ACTIVE', "isActive" = true, "deletedAt" = NULL`);

  // Ensure barcode 890351069409 is attached to COL1-XL variant
  await client.query(`UPDATE product_variants SET barcode = '890351069409' WHERE sku = 'COL1-XL'`);

  console.log('\n=== VERIFYING SCAN QUERY DIRECTLY IN SQL ===');
  const testScan = await client.query(`
    SELECT v.id, v.sku, v.barcode, v.title, p.name, p.channel, p.status
    FROM product_variants v
    JOIN products p ON v."productId" = p.id
    WHERE (v.barcode = '890351069409' OR v.sku = '890351069409')
      AND v."deletedAt" IS NULL
      AND p.channel IN ('STORE', 'BOTH')
  `);
  console.log('SQL Scan Match:', testScan.rows);

  await client.end();
}

main().catch(console.error);
