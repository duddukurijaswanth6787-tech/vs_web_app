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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    configService;
    logger = new common_1.Logger(RedisService_1.name);
    client;
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        const isRedisEnabled = this.configService.get('app.features.redis', true);
        if (!isRedisEnabled) {
            this.logger.warn('Redis is disabled by configuration. Initializing in-memory mock client.');
            const localStore = new Map();
            this.client = {
                get: async (key) => localStore.get(key) || null,
                set: async (key, value) => {
                    localStore.set(key, value);
                    return 'OK';
                },
                del: async (...keys) => {
                    let count = 0;
                    const flatKeys = keys.flat();
                    for (const key of flatKeys) {
                        if (localStore.delete(key))
                            count++;
                    }
                    return count;
                },
                keys: async (pattern) => {
                    const regexStr = pattern.replace(/\*/g, '.*');
                    const regex = new RegExp(`^${regexStr}$`);
                    return Array.from(localStore.keys()).filter((k) => regex.test(k));
                },
                ping: async () => 'PONG',
                on: (event, callback) => {
                    if (event === 'connect') {
                        setTimeout(callback, 0);
                    }
                    return this.client;
                },
                quit: async () => 'OK',
            };
            return;
        }
        const host = this.configService.get('app.redis.host', 'localhost');
        const port = this.configService.get('app.redis.port', 6379);
        const password = this.configService.get('app.redis.password', '');
        const db = this.configService.get('app.redis.db', 0);
        this.logger.log(`Initializing Redis client... host=${host} port=${port} db=${db} passwordSet=${!!password}`);
        this.client = new ioredis_1.Redis({
            host,
            port,
            password: password || undefined,
            db,
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
        this.client.on('connect', () => {
            this.logger.log('Successfully connected to Redis.');
        });
        this.client.on('error', (err) => {
            this.logger.error('Redis Client Error:', err);
        });
    }
    async onModuleDestroy() {
        this.logger.log('Closing Redis connection...');
        try {
            await this.client.quit();
            this.logger.log('Redis connection closed successfully.');
        }
        catch (err) {
            this.logger.error('Error closing Redis connection:', err);
        }
    }
    getClient() {
        return this.client;
    }
    async ping() {
        try {
            const response = await this.client.ping();
            return response === 'PONG';
        }
        catch (error) {
            this.logger.error('Redis health check ping failed:', error);
            return false;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map