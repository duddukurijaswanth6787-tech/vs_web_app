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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("./redis.service");
let CacheService = CacheService_1 = class CacheService {
    redisService;
    logger = new common_1.Logger(CacheService_1.name);
    constructor(redisService) {
        this.redisService = redisService;
    }
    async get(key) {
        try {
            const data = await this.redisService.getClient().get(key);
            return data ? JSON.parse(data) : null;
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds = 300) {
        try {
            await this.redisService
                .getClient()
                .set(key, JSON.stringify(value), 'EX', ttlSeconds);
        }
        catch {
            this.logger.warn(`Cache set failed for key ${key}`);
        }
    }
    async del(key) {
        try {
            await this.redisService.getClient().del(key);
        }
        catch {
            this.logger.warn(`Cache delete failed for key ${key}`);
        }
    }
    async delPattern(pattern) {
        try {
            const keys = await this.redisService.getClient().keys(pattern);
            if (keys.length)
                await this.redisService.getClient().del(...keys);
        }
        catch {
            this.logger.warn(`Cache pattern delete failed for ${pattern}`);
        }
    }
    async getOrSet(key, factory, ttlSeconds = 300) {
        const cached = await this.get(key);
        if (cached !== null)
            return cached;
        const value = await factory();
        await this.set(key, value, ttlSeconds);
        return value;
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], CacheService);
//# sourceMappingURL=cache.service.js.map