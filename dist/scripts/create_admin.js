"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const argon2 = __importStar(require("argon2"));
async function createAdmin() {
    const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
    const prisma = new client_1.PrismaClient({ adapter });
    const passwordHash = await argon2.hash('Admin@123');
    const adminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
    if (!adminRole) {
        console.error('Admin role not found!');
        process.exit(1);
    }
    const admin = await prisma.user.upsert({
        where: { email: 'admin@vasanthi.com' },
        update: { passwordHash: passwordHash },
        create: {
            email: 'admin@vasanthi.com',
            passwordHash: passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            userType: 'ADMIN',
            accountStatus: 'ACTIVE',
            isEmailVerified: true,
            userRoles: {
                create: { roleId: adminRole.id }
            }
        }
    });
    console.log('Admin user upserted:', admin.email);
    await prisma.$disconnect();
}
createAdmin().catch(console.error);
//# sourceMappingURL=create_admin.js.map