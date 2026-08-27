import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || process.env["POSTGRES_URL"] || process.env["DATABASE_PUBLIC_URL"] || "postgresql://postgres:postgres@localhost:5432/vasanthi_db",
  },
});
