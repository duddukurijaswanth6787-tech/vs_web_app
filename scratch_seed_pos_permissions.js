const { Client } = require('pg');

const NEW_PERMISSIONS = [
  { code: 'pos:view', name: 'View POS Terminal', module: 'pos', description: 'Allows opening the POS Billing Counter terminal (/pos).' },
  { code: 'pos:manage', name: 'Manage POS Privileges', module: 'pos', description: 'Controls whether cashier can give custom discounts or process returns.' },
  { code: 'pos:add-stock', name: 'POS Add Stock', module: 'pos', description: 'Controls access to Add Stock & Print Barcode Labels (/pos/add-stock).' },
  { code: 'pos:printers', name: 'POS Hardware & Printers', module: 'pos', description: 'Controls access to Thermal Receipt & Hardware Printer Settings (/pos/printers).' },
  { code: 'pos:billing', name: 'POS Billing', module: 'pos', description: 'Allows processing counter billing sales.' },
  { code: 'pos:refund', name: 'POS Counter Refund', module: 'pos', description: 'Allows processing counter cash returns and refunds.' },
  { code: 'quotations:create', name: 'Create Quotations', module: 'quotations', description: 'Controls whether cashier can create Draft Quotations.' },
  { code: 'quotations:view', name: 'View Quotations', module: 'quotations', description: 'Allows viewing quotations list.' },
  { code: 'quotations:update', name: 'Update Quotations', module: 'quotations', description: 'Allows editing draft quotations.' },
  { code: 'quotations:convert', name: 'Convert Quotations', module: 'quotations', description: 'Allows converting draft quotations to billed orders.' },
];

async function main() {
  const connectionString = 'postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@junction.proxy.rlwy.net:47577/railway';
  const client = new Client({ connectionString });
  await client.connect();

  console.log('=== Upserting POS & Quotations Permissions in Railway DB ===');

  for (const perm of NEW_PERMISSIONS) {
    const existing = await client.query(`SELECT id FROM permissions WHERE code = $1`, [perm.code]);
    let permId;
    if (existing.rows.length > 0) {
      permId = existing.rows[0].id;
      await client.query(`UPDATE permissions SET name = $1, description = $2, module = $3 WHERE id = $4`, [perm.name, perm.description, perm.module, permId]);
    } else {
      const inserted = await client.query(
        `INSERT INTO permissions (id, code, name, description, module, scope, "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'MODULE', true, NOW(), NOW())
         RETURNING id`,
        [perm.code, perm.name, perm.description, perm.module]
      );
      permId = inserted.rows[0].id;
    }
    console.log(`Permission ${perm.code} (ID: ${permId}) verified/upserted with clean description.`);

    // Assign to super_admin and admin roles by default so super admin can manage them
    const rolesRes = await client.query(`SELECT id, name FROM roles WHERE name IN ('super_admin', 'admin')`);
    for (const r of rolesRes.rows) {
      await client.query(`INSERT INTO role_permissions ("roleId", "permissionId") VALUES ($1, $2) ON CONFLICT DO NOTHING`, [r.id, permId]);
    }
  }

  console.log('Successfully updated/seeded all POS & Quotation permissions in Railway Production DB!');
  await client.end();
}

main().catch(console.error);
