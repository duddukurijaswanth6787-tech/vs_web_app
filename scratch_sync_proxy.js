const { Client } = require('pg');

async function main() {
  const connectionString = 'postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@junction.proxy.rlwy.net:47577/railway';
  const client = new Client({ connectionString });
  await client.connect();

  await client.query('UPDATE products SET barcode = $1 WHERE id = $2', ['890711718853', 'c56e47f8-3c98-4fab-8665-9fc7f1eaadc5']);
  await client.query('UPDATE products SET barcode = $1, "basePrice" = 1799 WHERE id = $2', ['890351069409', '7a1a81cf-fa83-451b-af36-c1f60e5b599c']);
  await client.query('UPDATE product_variants SET "priceOverride" = 1799, barcode = $1 WHERE sku = $2', ['890351069409', 'COL1-XL']);

  const checkVariant = await client.query('SELECT id, "productId", sku, barcode, title, "priceOverride" FROM product_variants WHERE sku = $1', ['COL1-XL']);
  console.log('Final Variant Record in PostgreSQL:', checkVariant.rows[0]);

  const checkProduct = await client.query('SELECT id, name, sku, barcode, "basePrice" FROM products WHERE id = $1', ['7a1a81cf-fa83-451b-af36-c1f60e5b599c']);
  console.log('Final Product Record in PostgreSQL:', checkProduct.rows[0]);

  await client.end();
  console.log('SUCCESSFULLY COMPLETED!');
}

main().catch(console.error);
