import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { Queue } from 'bullmq';
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
export declare class HealthController {
    private readonly health;
    private readonly prismaService;
    private readonly redisService;
    private readonly storageService;
    private readonly healthQueue;
    private readonly logger;
    constructor(health: HealthCheckService, prismaService: PrismaService, redisService: RedisService, storageService: StorageService, healthQueue: Queue);
    check(): Promise<HealthCheckResult>;
}
