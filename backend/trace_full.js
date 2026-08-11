const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public' });

(async () => {
  await client.connect();

  console.log('=== STEP 1: DATABASE VERIFICATION ===\n');

  // Product
  const products = await client.query('SELECT id, name FROM products LIMIT 1');
  const product = products.rows[0];
  console.log('Product: ' + product.name + ' (' + product.id + ')');

  // Product media
  const pm = await client.query(`
    SELECT id, "mediaType", url, "thumbnailUrl", "isPrimary", "displayOrder"
    FROM product_media 
    WHERE "productId" = $1 AND "deletedAt" IS NULL
    ORDER BY "displayOrder"
  `, [product.id]);

  console.log('\nProduct Media (' + pm.rows.length + ' rows):');
  for (const m of pm.rows) {
    const isSvg = m.url && m.url.startsWith('data:');
    console.log('  ' + m.mediaType + ' | ' + (isSvg ? 'SVG!' : 'OK') + ' | url=' + (m.url || 'NULL').substring(0, 80));
    console.log('    thumbnailUrl=' + (m.thumbnailUrl || 'NULL').substring(0, 80));
  }

  // Check ALL products
  console.log('\n=== ALL PRODUCTS ===\n');
  const allPm = await client.query(`
    SELECT p.name, pm.url, pm."mediaType"
    FROM product_media pm
    JOIN products p ON p.id = pm."productId"
    WHERE pm."deletedAt" IS NULL AND pm."displayOrder" = 0
  `);
  for (const r of allPm.rows) {
    const isSvg = r.url && r.url.startsWith('data:');
    console.log(r.name + ': ' + (isSvg ? 'SVG' : 'OK'));
  }

  await client.end();
})();
