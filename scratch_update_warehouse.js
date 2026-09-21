const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:UmAGPwHEyraVlnXxcZgFGdljetlkyEFL@nozomi.proxy.rlwy.net:16688/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  await client.query(`
    UPDATE warehouses 
    SET 
      address = 'Plot No. 42, Road No. 36, Jubilee Hills',
      "postalCode" = '500033',
      phone = '+91 98765 43210',
      "contactPerson" = 'Store Dispatch Manager',
      email = 'contact@vasanthissignature.in',
      "updatedAt" = NOW()
    WHERE id = 'b9e39ab4-10c9-4e64-a58a-d34ac87022fd'
  `);
  const res = await client.query('SELECT * FROM warehouses');
  console.log('Successfully updated warehouse:\n', JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
