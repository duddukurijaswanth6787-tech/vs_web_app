import { RedisService } from './redis.service';
export declare class CacheService {
    private readonly redisService;
    private readonly logger;
    constructor(redisService: RedisService);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
}
