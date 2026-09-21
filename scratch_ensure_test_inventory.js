const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:UmAGPwHEyraVlnXxcZgFGdljetlkyEFL@nozomi.proxy.rlwy.net:16688/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const inv = await client.query('SELECT * FROM "inventory" WHERE "variantId" = $1', ['f0dfdac3-a45e-4e30-b3c5-03e000701c34']);
  console.log('Inventory for Test variant (f0dfdac3-a45e-4e30-b3c5-03e000701c34):');
  console.log(JSON.stringify(inv.rows, null, 2));

  if (inv.rows.length === 0) {
    console.log('No inventory row found. Creating one with availableQuantity = 10...');
    const crypto = require('crypto');
    const invId = crypto.randomUUID();
    await client.query(`
      INSERT INTO "inventory" (id, "variantId", "warehouseId", "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "stockStatus", "updatedAt")
      VALUES ($1, $2, 'b9e39ab4-10c9-4e64-a58a-d34ac87022fd', 10, 0, 1, 2, 'IN_STOCK', NOW())
    `, [invId, 'f0dfdac3-a45e-4e30-b3c5-03e000701c34']);
    console.log('Inventory created with stock = 10!');
  }

  await client.end();
}

main().catch(console.error);
