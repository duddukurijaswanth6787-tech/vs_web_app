import "dotenv/config";
import { defineConfig } from "prisma/config";

const getDbUrl = (): string => {
  const envUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_PUBLIC_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.trim();
  }
  return "postgresql://postgres:postgres@localhost:5432/vasanthi_db";
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node prisma/seed.ts",
  },
  datasource: {
    url: getDbUrl(),
  },
});
