import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisService.getClient().get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    try {
      await this.redisService
        .getClient()
        .set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      this.logger.warn(`Cache set failed for key ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisService.getClient().del(key);
    } catch {
      this.logger.warn(`Cache delete failed for key ${key}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length) await this.redisService.getClient().del(...keys);
    } catch {
      this.logger.warn(`Cache pattern delete failed for ${pattern}`);
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 300,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}
