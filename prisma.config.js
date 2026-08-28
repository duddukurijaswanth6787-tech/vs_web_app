require("dotenv").config();
const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  schema: "backend/prisma/schema.prisma",
  migrations: {
    path: "backend/prisma/migrations",
    seed: "npx ts-node backend/prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_PUBLIC_URL || "postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@postgres.railway.internal:5432/railway",
  },
});
