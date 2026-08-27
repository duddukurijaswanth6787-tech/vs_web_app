"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("prisma/config");
const getDbUrl = () => {
    const envUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_PUBLIC_URL;
    if (envUrl && envUrl.trim().length > 0) {
        return envUrl.trim();
    }
    return "postgresql://postgres:postgres@localhost:5432/vasanthi_db";
};
exports.default = (0, config_1.defineConfig)({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "npx ts-node prisma/seed.ts",
    },
    datasource: {
        url: getDbUrl(),
    },
});
//# sourceMappingURL=prisma.config.js.map