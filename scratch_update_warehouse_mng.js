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
      code = 'MNG-01',
      name = 'Manuguru Main Warehouse',
      description = 'Main Dispatch Warehouse',
      address = 'VASANTHI CREATIONS PVT LTD 2-1-156/3 Ashoknagar main road, Samithi singaram grama panchayati, Beside MORE super market',
      city = 'Manuguru',
      state = 'Telangana',
      country = 'India',
      "postalCode" = '507117',
      "contactPerson" = 'Jagadeep / Jaswanth',
      phone = '+91 7659034198',
      email = 'contact@vasanthissignature.in',
      "updatedAt" = NOW()
    WHERE id = 'b9e39ab4-10c9-4e64-a58a-d34ac87022fd'
  `);
  const res = await client.query('SELECT * FROM warehouses');
  console.log('Updated Warehouse in DB:\n', JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
