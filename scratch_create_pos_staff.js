const { Client } = require('pg');
const argon2 = require('argon2');

async function main() {
  const connectionString = 'postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@junction.proxy.rlwy.net:47577/railway';
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== Upserting Dedicated POS Staff Account in Railway DB ===');
  
  const email = 'posstaff@vasanthi.com';
  const password = 'Pos@1234';
  const pin = '1234';

  const passwordHash = await argon2.hash(password);
  const posPinHash = await argon2.hash(pin);

  // Check if role pos_operator exists, if not create it or use staff role
  let roleRes = await client.query(`SELECT id FROM roles WHERE name = 'pos_operator' OR name = 'pos_staff'`);
  let roleId = roleRes.rows[0]?.id;

  if (!roleId) {
    const newRole = await client.query(`INSERT INTO roles (id, name, description, "createdAt", "updatedAt") VALUES (gen_random_uuid(), 'pos_operator', 'POS Counter Billing Staff', NOW(), NOW()) RETURNING id`);
    roleId = newRole.rows[0].id;
  }

  // Check user
  let userRes = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
  let userId;

  if (userRes.rows.length > 0) {
    userId = userRes.rows[0].id;
    await client.query(
      `UPDATE users SET "passwordHash" = $1, "posPinHash" = $2, "userType" = 'STAFF', "accountStatus" = 'ACTIVE', "firstName" = 'Counter 1', "lastName" = 'Billing Cashier' WHERE id = $3`,
      [passwordHash, posPinHash, userId]
    );
    console.log(`Updated existing POS staff user ${email}`);
  } else {
    const newUser = await client.query(
      `INSERT INTO users (id, email, "passwordHash", "posPinHash", "userType", "accountStatus", "firstName", "lastName", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 'STAFF', 'ACTIVE', 'Counter 1', 'Billing Cashier', NOW(), NOW())
       RETURNING id`,
      [email, passwordHash, posPinHash]
    );
    userId = newUser.rows[0].id;
    console.log(`Created new POS staff user ${email}`);
  }

  // Assign pos_operator role in user_roles
  await client.query(`DELETE FROM user_roles WHERE "userId" = $1`, [userId]);
  await client.query(`INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2)`, [userId, roleId]);

  console.log('Successfully configured POS Staff credentials: posstaff@vasanthi.com / Pos@1234 (PIN: 1234)');
  await client.end();
}

main().catch(console.error);
