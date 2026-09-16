const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const LIVE_DB_URL = 'postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@junction.proxy.rlwy.net:47577/railway';

async function inspectDb() {
  const isLive = process.argv.includes('--live');
  const dbUrl = isLive ? LIVE_DB_URL : process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('Error: DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: isLive ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await client.connect();
    console.log(`\n✔ Connected to ${isLive ? 'LIVE PRODUCTION (Railway)' : 'LOCAL (localhost:5432)'} Database successfully.\n`);

    // List all public tables and row counts
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`📊 Found ${tables.length} tables in public schema:\n`);
    console.log('------------------------------------------------------------');
    console.log(String('Table Name').padEnd(35) + 'Row Count');
    console.log('------------------------------------------------------------');

    for (const table of tables) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
        const count = countRes.rows[0].count;
        console.log(String(table).padEnd(35) + count);
      } catch (err) {
        console.log(String(table).padEnd(35) + 'Error: ' + err.message);
      }
    }
    console.log('------------------------------------------------------------\n');
  } catch (err) {
    console.error('Database connection error:', err.message);
  } finally {
    await client.end();
  }
}

inspectDb();
