import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:jlEKlMCjFYyJfSWDlJuCgvrqCVfBivQD@postgres.railway.internal:5432/railway",
  },
});
