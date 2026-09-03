const { Client } = require('pg');

async function main() {
  const connectionString = 'postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@junction.proxy.rlwy.net:47577/railway';
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== Checking Admin Users in Railway DB ===');
  const u = await client.query(`SELECT id, email, "userType", "accountStatus", "passwordHash", "posPinHash" FROM users WHERE email LIKE '%admin%' OR "userType" != 'CUSTOMER'`);
  console.log(u.rows);

  await client.end();
}

main().catch(console.error);
