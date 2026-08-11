const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public' });

const BASE = 'http://localhost:4000/api/v1/storage/products/50890861-0fb4-4b93-91b2-231422e0fa49/images';

// The actual storage files (verified to exist as real PNGs)
const ACTUAL_FILES = [
  'bf440116-b297-4648-9296-639f6ebfba53.png', // MAIN
  '9911e693-c306-4bd0-a308-9a6372ebfd07.png', // FRONT
  '7027e0e8-0450-4a09-84a0-e76f84c88935.png', // BACK
  '959a62d3-06e3-47a5-8691-2aaf901ec776.png', // SIDE
  '9a043b4f-33a6-4dad-81ca-a8175c87a358.png', // FABRIC
  'a281f7bd-0cea-4756-afeb-9d95ee281042.png', // MODEL
];

(async () => {
  await client.connect();

  // Get product_media records ordered by displayOrder
  const pm = await client.query(`
    SELECT id, "mediaType", "displayOrder"
    FROM product_media
    WHERE "productId" = '50890861-0fb4-4b93-91b2-231422e0fa49' AND "deletedAt" IS NULL
    ORDER BY "displayOrder"
  `);

  console.log('=== MAPPING product_media → storage files ===\n');
  for (let i = 0; i < pm.rows.length; i++) {
    const record = pm.rows[i];
    const file = ACTUAL_FILES[i];
    const url = BASE + '/' + file;
    
    console.log(record.mediaType + ' (order=' + record.displayOrder + '): ' + record.id);
    console.log('  → ' + file);
    
    // Update the URL
    await client.query(
      'UPDATE product_media SET url = $1, "thumbnailUrl" = $1 WHERE id = $2',
      [url, record.id]
    );
    console.log('  Updated ✓');
  }

  // Verify
  console.log('\n=== VERIFICATION ===\n');
  const verify = await client.query(`
    SELECT "mediaType", url FROM product_media
    WHERE "productId" = '50890861-0fb4-4b93-91b2-231422e0fa49' AND "deletedAt" IS NULL
    ORDER BY "displayOrder"
  `);
  for (const r of verify.rows) {
    const isSvg = r.url.startsWith('data:');
    console.log(r.mediaType + ': ' + (isSvg ? 'SVG!' : 'OK') + ' ' + r.url.substring(0, 90));
  }

  await client.end();
})();
