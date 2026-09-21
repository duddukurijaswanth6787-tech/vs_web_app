const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:UmAGPwHEyraVlnXxcZgFGdljetlkyEFL@nozomi.proxy.rlwy.net:16688/railway',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database.');

  await client.query(`
    CREATE TABLE IF NOT EXISTS "website_settings" (
      "id" TEXT NOT NULL,
      "storeName" TEXT NOT NULL DEFAULT 'Vasanthi''s Signature',
      "storeDescription" TEXT DEFAULT 'Luxury Ethnic Wear & Couture',
      "logo" TEXT,
      "favicon" TEXT,
      "supportEmail" TEXT DEFAULT 'contact@vasanthissignature.in',
      "supportPhone" TEXT DEFAULT '+91 7659034198',
      "whatsappNumber" TEXT DEFAULT '+91 7659034198',
      "supportHours" TEXT DEFAULT '10:00 AM - 9:00 PM',
      "companyAddress" TEXT DEFAULT 'VASANTHI CREATIONS PVT LTD 2-1-156/3 Ashoknagar main road, Manuguru, Telangana - 507117',
      "currency" TEXT NOT NULL DEFAULT 'INR',
      "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      "language" TEXT NOT NULL DEFAULT 'en',
      "copyrightText" TEXT DEFAULT '© 2026 Vasanthi''s Signature. All Rights Reserved.',
      "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
      "metaTitle" TEXT DEFAULT 'Vasanthi''s Signature - Luxury Couture',
      "metaDescription" TEXT,
      "metaKeywords" TEXT,
      "companyGstin" TEXT DEFAULT '36AABCU9603R1ZM',
      "companyCity" TEXT DEFAULT 'Manuguru',
      "companyState" TEXT DEFAULT 'Telangana',
      "companyPincode" TEXT DEFAULT '507117',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deletedAt" TIMESTAMP(3),
      CONSTRAINT "website_settings_pkey" PRIMARY KEY ("id")
    );
  `);
  console.log('✔ Table "website_settings" ensured.');

  const existing = await client.query('SELECT id FROM "website_settings" LIMIT 1');
  if (existing.rows.length === 0) {
    const crypto = require('crypto');
    const id = crypto.randomUUID();
    await client.query(`
      INSERT INTO "website_settings" ("id", "storeName", "supportPhone", "supportEmail", "companyAddress", "companyCity", "companyState", "companyPincode", "companyGstin")
      VALUES ($1, 'Vasanthi''s Signature', '+91 7659034198', 'contact@vasanthissignature.in', 'VASANTHI CREATIONS PVT LTD 2-1-156/3 Ashoknagar main road, Manuguru, Telangana - 507117', 'Manuguru', 'Telangana', '507117', '36AABCU9603R1ZM')
    `, [id]);
    console.log('✔ Inserted default website_settings row.');
  } else {
    console.log('✔ website_settings row exists.');
  }

  await client.end();
}

main().catch(console.error);
