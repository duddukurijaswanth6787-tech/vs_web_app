"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const database_constants_1 = require("./database.constants");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    configService;
    connected = false;
    logger = new common_1.Logger(PrismaService_1.name);
    constructor(configService) {
        const url = configService.get('app.database.url') || '';
        const adapter = new adapter_pg_1.PrismaPg({ connectionString: url });
        const env = configService.get('app.env', 'development');
        super({
            adapter,
            log: [
                ...(env !== 'production' && process.env.PRISMA_QUERY_LOGS === 'true'
                    ? [{ emit: 'event', level: 'query' }]
                    : []),
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'info' },
                { emit: 'event', level: 'warn' },
            ],
        });
        this.configService = configService;
    }
    async onModuleInit() {
        const maxRetries = database_constants_1.DATABASE_CONSTANTS.RETRY_COUNT;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                await this.$connect();
                this.connected = true;
                this.setupEventListeners();
                return;
            }
            catch (error) {
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10_000);
                    this.logger.warn(`Database connection attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    this.logger.error('Failed to connect to PostgreSQL database after retries', error instanceof Error ? error.message : String(error));
                    process.exit(1);
                }
            }
        }
    }
    setupEventListeners() {
        const client = this;
        const slowQueryThreshold = this.configService.get('app.database.slowQueryThreshold', database_constants_1.DATABASE_CONSTANTS.SLOW_QUERY_THRESHOLD);
        client.$on('query', (e) => {
            const duration = e.duration || 0;
            if (duration > slowQueryThreshold) {
                this.logger.warn(`Slow query (${duration}ms): ${e.query}`, 'PrismaSlowQuery');
            }
        });
        client.$on('error', (e) => {
            this.logger.error(`Prisma Error: ${e.message || ''}`);
        });
        client.$on('warn', (e) => {
            this.logger.warn(`Prisma Warning: ${e.message || ''}`);
        });
        client.$on('info', (e) => {
            this.logger.log(`Prisma Info: ${e.message || ''}`);
        });
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.connected = false;
    }
    async ping() {
        try {
            await this.$executeRawUnsafe('SELECT 1');
            return true;
        }
        catch {
            return false;
        }
    }
    get isConnected() {
        return this.connected;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map