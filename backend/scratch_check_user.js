const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres:wFfJqYfIuRkFftQcKxOQkZdNsUvWfMvJ@junction.proxy.rlwy.net:47577/railway',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const res = await client.query(`
    SELECT u.id, u.email, u.first_name, u.last_name, r.name as role_name, p.code as permission_code
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON rp.permission_id = p.id
    WHERE u.email = 'test.pos@gmail.com'
  `);

  if (res.rows.length === 0) {
    console.log('No user found for test.pos@gmail.com');
  } else {
    const first = res.rows[0];
    const roles = [...new Set(res.rows.map(r => r.role_name).filter(Boolean))];
    const permissions = [...new Set(res.rows.map(r => r.permission_code).filter(Boolean))];

    console.log('--- USER PROFILE IN PG DATABASE ---');
    console.log('ID:', first.id);
    console.log('Email:', first.email);
    console.log('Name:', `${first.first_name || ''} ${first.last_name || ''}`);
    console.log('Roles:', roles);
    console.log('Permissions Count:', permissions.length);
    console.log('Permissions List:', permissions);
  }

  await client.end();
}

run().catch(console.error);
