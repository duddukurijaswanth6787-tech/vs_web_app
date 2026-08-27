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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AutoSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoSeedService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const argon2 = __importStar(require("argon2"));
const SYSTEM_ROLES = [
    {
        name: 'super_admin',
        displayName: 'Super Admin',
        description: 'Full system access',
        scope: 'GLOBAL',
        hierarchy: 100,
        isSystem: true,
    },
    {
        name: 'admin',
        displayName: 'Admin',
        description: 'Administrative access',
        scope: 'GLOBAL',
        hierarchy: 80,
        isSystem: true,
    },
    {
        name: 'staff',
        displayName: 'Staff',
        description: 'Staff member access',
        scope: 'DOMAIN',
        hierarchy: 50,
        isSystem: true,
    },
    {
        name: 'pos_operator',
        displayName: 'POS Operator',
        description: 'Billing counter access only — confined to the standalone Shopora POS screen, no admin console',
        scope: 'DOMAIN',
        hierarchy: 40,
        isSystem: true,
    },
    {
        name: 'customer',
        displayName: 'Customer',
        description: 'Customer access',
        scope: 'CUSTOM',
        hierarchy: 10,
        isSystem: true,
    },
];
const PERMISSION_MODULES = {
    dashboard: ['view'],
    users: ['view', 'create', 'update', 'delete'],
    staff: ['view', 'create', 'update', 'delete'],
    products: ['view', 'create', 'update', 'delete'],
    categories: ['view', 'create', 'update', 'delete'],
    brands: ['view', 'create', 'update', 'delete'],
    inventory: ['view', 'update'],
    orders: ['view', 'update'],
    payments: ['view', 'update'],
    reports: ['view', 'export'],
    settings: ['view', 'update'],
    coupons: ['view', 'create', 'update', 'delete'],
    reviews: ['view', 'update'],
    customers: ['view', 'update'],
    pos: ['view'],
};
let AutoSeedService = AutoSeedService_1 = class AutoSeedService {
    prisma;
    logger = new common_1.Logger(AutoSeedService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        try {
            await this.prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS "facebookId" TEXT;');
            await this.prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS "appleId" TEXT;');
            await this.prisma.$executeRawUnsafe('ALTER TABLE products ADD COLUMN IF NOT EXISTS "warrantyInfo" TEXT;');
            await this.prisma.$executeRawUnsafe('ALTER TABLE products ADD COLUMN IF NOT EXISTS "careInstructions" TEXT;');
            await this.prisma.$executeRawUnsafe('ALTER TABLE products ADD COLUMN IF NOT EXISTS "hsnCode" TEXT;');
            await this.prisma.$executeRawUnsafe('ALTER TABLE products ADD COLUMN IF NOT EXISTS "countryOfOrigin" TEXT;');
            await this.prisma.$executeRawUnsafe('ALTER TABLE products ADD COLUMN IF NOT EXISTS "colorGroup" TEXT;');
        }
        catch {
        }
        await this.seedEssentialData();
    }
    async seedEssentialData() {
        this.logger.log('Verifying essential database roles and admin user...');
        for (const role of SYSTEM_ROLES) {
            await this.prisma.role.upsert({
                where: { name: role.name },
                update: {},
                create: role,
            });
        }
        for (const [module, actions] of Object.entries(PERMISSION_MODULES)) {
            for (const action of actions) {
                const code = `${module}:${action}`;
                await this.prisma.permission.upsert({
                    where: { code },
                    update: {},
                    create: {
                        code,
                        name: `${action.charAt(0).toUpperCase()}${action.slice(1)} ${module.charAt(0).toUpperCase()}${module.slice(1)}`,
                        module,
                        scope: 'MODULE',
                    },
                });
            }
        }
        const superAdminRole = await this.prisma.role.findUnique({
            where: { name: 'super_admin' },
        });
        if (!superAdminRole) {
            this.logger.warn('super_admin role missing after role upsert');
            return;
        }
        const ADMIN_EMAILS = Array.from(new Set([
            'admin@vasanthi.com',
            'admin@vasanthidesigners.com',
            (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
        ])).filter(Boolean);
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
        const passwordHash = await argon2.hash(adminPassword);
        for (const email of ADMIN_EMAILS) {
            const adminUser = await this.prisma.user.upsert({
                where: { email },
                update: {
                    passwordHash,
                    userType: 'ADMIN',
                    accountStatus: 'ACTIVE',
                    isEmailVerified: true,
                    loginAttempts: 0,
                    lockoutUntil: null,
                },
                create: {
                    email,
                    passwordHash,
                    firstName: 'Admin',
                    lastName: 'User',
                    userType: 'ADMIN',
                    accountStatus: 'ACTIVE',
                    isEmailVerified: true,
                    loginAttempts: 0,
                },
            });
            const existingRoleLink = await this.prisma.userRole.findFirst({
                where: { userId: adminUser.id, roleId: superAdminRole.id },
            });
            if (!existingRoleLink) {
                await this.prisma.userRole.create({
                    data: {
                        userId: adminUser.id,
                        roleId: superAdminRole.id,
                    },
                });
            }
            this.logger.log(`Essential admin user verified/seeded successfully: ${email}`);
        }
        const sessionSettings = [
            {
                key: 'security.sessionExpiryMinutes',
                value: '15',
                description: 'How long a normal login session stays valid, in minutes, before the user must sign in again.',
            },
            {
                key: 'security.rememberMeExpiryDays',
                value: '30',
                description: 'How long a "Remember Me" login session stays valid, in days.',
            },
        ];
        for (const s of sessionSettings) {
            await this.prisma.appSetting.upsert({
                where: { key: s.key },
                update: {},
                create: {
                    key: s.key,
                    value: s.value,
                    type: 'NUMBER',
                    group: 'security',
                    description: s.description,
                },
            });
        }
        const custPassword = await argon2.hash('Customer@123');
        for (const custEmail of ['customer@vasanthi.com', 'customer@vasanthidesigners.com']) {
            await this.prisma.user.upsert({
                where: { email: custEmail },
                update: {
                    passwordHash: custPassword,
                    userType: 'CUSTOMER',
                    accountStatus: 'ACTIVE',
                    isEmailVerified: true,
                    loginAttempts: 0,
                    lockoutUntil: null,
                },
                create: {
                    email: custEmail,
                    passwordHash: custPassword,
                    firstName: 'Anjali',
                    lastName: 'Sharma',
                    userType: 'CUSTOMER',
                    accountStatus: 'ACTIVE',
                    isEmailVerified: true,
                    loginAttempts: 0,
                },
            });
        }
        this.logger.log('Essential security roles, permissions and admin users initialized.');
    }
};
exports.AutoSeedService = AutoSeedService;
exports.AutoSeedService = AutoSeedService = AutoSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AutoSeedService);
//# sourceMappingURL=auto-seed.service.js.map