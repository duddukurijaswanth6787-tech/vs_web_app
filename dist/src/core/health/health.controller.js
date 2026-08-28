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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var HealthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const terminus_1 = require("@nestjs/terminus");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../database/prisma.service");
const redis_service_1 = require("../../infrastructure/redis/redis.service");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const DB_PING_TIMEOUT_MS = 10_000;
function withTimeout(promise, timeoutMs, fallbackValue) {
    let timer;
    const timeoutPromise = new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}
let HealthController = HealthController_1 = class HealthController {
    health;
    prismaService;
    redisService;
    storageService;
    healthQueue;
    logger = new common_1.Logger(HealthController_1.name);
    constructor(health, prismaService, redisService, storageService, healthQueue) {
        this.health = health;
        this.prismaService = prismaService;
        this.redisService = redisService;
        this.storageService = storageService;
        this.healthQueue = healthQueue;
    }
    async check() {
        return this.health.check([
            async () => {
                const isUp = await withTimeout(this.prismaService.ping(), DB_PING_TIMEOUT_MS, false);
                return {
                    database: {
                        status: isUp ? 'up' : 'down',
                        connected: this.prismaService.isConnected,
                    },
                };
            },
            async () => {
                try {
                    const rows = await withTimeout(this.prismaService.$queryRawUnsafe('SELECT COUNT(*)::int as count FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL'), 2000, []);
                    const count = Number(rows[0]?.count ?? 0);
                    return {
                        migrations: {
                            status: 'up',
                            appliedCount: count,
                        },
                    };
                }
                catch {
                    return {
                        migrations: {
                            status: 'up',
                            appliedCount: 0,
                        },
                    };
                }
            },
            async () => {
                const isUp = await withTimeout(this.redisService.ping(), 1500, false);
                const isRedisEnabled = process.env.ENABLE_REDIS !== 'false';
                return {
                    redis: {
                        status: 'up',
                        connectionState: isUp ? 'connected' : 'disconnected',
                        runtimeType: isRedisEnabled ? 'real' : 'mock',
                    },
                };
            },
            async () => {
                const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';
                let isUp = false;
                try {
                    if (isBullMQEnabled && this.healthQueue) {
                        const queueCheck = async () => {
                            const client = (await this.healthQueue.client);
                            const pingResult = await client.ping();
                            return pingResult === 'PONG';
                        };
                        isUp = await withTimeout(queueCheck(), 1500, false);
                    }
                }
                catch (error) {
                    this.logger.error(`BullMQ health check failed: ${error instanceof Error ? error.message : String(error)}`);
                    isUp = false;
                }
                return {
                    queue: {
                        status: 'up',
                        connectionState: isUp ? 'connected' : 'disconnected',
                        runtimeType: isBullMQEnabled ? 'real' : 'mock',
                        provider: isBullMQEnabled ? 'bullmq' : 'in-memory',
                    },
                };
            },
            async () => {
                let result = { writable: true, provider: 'local', root: './storage' };
                try {
                    result = await withTimeout(this.storageService.healthCheck(), 1500, result);
                }
                catch (error) {
                    this.logger.error(`Storage health check failed: ${error instanceof Error ? error.message : String(error)}`);
                }
                const isS3Emulator = !!process.env.AWS_S3_ENDPOINT;
                const runtimeType = result.provider === 's3'
                    ? isS3Emulator
                        ? 'emulator'
                        : 'real'
                    : 'local';
                return {
                    storage: {
                        status: 'up',
                        provider: result.provider,
                        runtimeType,
                        writable: result.writable,
                        configured: result.provider === 'local' || result.provider === 's3',
                    },
                };
            },
            async () => {
                const enabled = process.env.RAG_ENABLED !== 'false';
                const llmProvider = process.env.RAG_LLM_PROVIDER || 'gemini';
                const embeddingProvider = process.env.RAG_EMBEDDING_PROVIDER || 'gemini';
                let llmStatus = 'UP';
                const llmKey = process.env.GEMINI_API_KEY ||
                    process.env.GOOGLE_API_KEY ||
                    process.env.OPENAI_API_KEY;
                if (llmKey === 'mock_key' || llmKey === 'mock_secret') {
                    llmStatus = 'MOCK';
                }
                else if (!llmKey && !enabled) {
                    llmStatus = 'DISABLED';
                }
                let embeddingStatus = 'UNCONFIGURED';
                const embeddingKey = embeddingProvider === 'gemini'
                    ? process.env.GEMINI_API_KEY
                    : process.env.OPENAI_API_KEY;
                if (embeddingKey &&
                    embeddingKey !== 'mock_key' &&
                    embeddingKey !== 'mock_secret' &&
                    embeddingKey !== '') {
                    embeddingStatus = 'UP';
                }
                if (!enabled) {
                    llmStatus = 'DISABLED';
                    embeddingStatus = 'DISABLED';
                }
                const dbConnected = await withTimeout(this.prismaService.ping(), 1500, false);
                const vectorDbStatus = dbConnected ? 'UP' : 'DOWN';
                return {
                    rag: {
                        status: 'up',
                        enabled,
                        llm: {
                            provider: llmProvider,
                            status: llmStatus,
                        },
                        embedding: {
                            provider: embeddingProvider,
                            status: embeddingStatus,
                        },
                        ingestionQueue: {
                            status: dbConnected ? 'UP' : 'DOWN',
                        },
                        vectorDatabase: {
                            status: vectorDbStatus,
                        },
                    },
                };
            },
            async () => ({ app: { status: 'up' } }),
        ]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
exports.HealthController = HealthController = HealthController_1 = __decorate([
    (0, common_1.Controller)('health'),
    __param(4, (0, bullmq_1.InjectQueue)('rag-ingestion')),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService,
        prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        storage_service_1.StorageService,
        bullmq_2.Queue])
], HealthController);
//# sourceMappingURL=health.controller.js.map