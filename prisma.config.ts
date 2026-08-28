import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "backend/prisma/schema.prisma",
  migrations: {
    path: "backend/prisma/migrations",
    seed: "npx ts-node backend/prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@postgres.railway.internal:5432/railway",
  },
});
