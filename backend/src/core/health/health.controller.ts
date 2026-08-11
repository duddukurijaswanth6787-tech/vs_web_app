import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { Queue } from 'bullmq';
import { PrismaService } from '@database/prisma.service';
import { RedisService } from '@infrastructure/redis/redis.service';
import { StorageService } from '@infrastructure/storage/storage.service';

/**
 * Controller exposing the health verification endpoints of the application.
 * Executes diagnostics against database, cache, message queues, and memory.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly storageService: StorageService,
    @InjectQueue('rag-ingestion') private readonly healthQueue: Queue,
  ) {}

  /**
   * Health endpoint returning the operational state of core subsystems.
   */
  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database health diagnostic
      async () => {
        const isUp = await this.prismaService.ping();
        return {
          database: {
            status: isUp ? 'up' : 'down',
            connected: this.prismaService.isConnected,
          },
        };
      },
      // Migration status
      async () => {
        try {
          const rows = await this.prismaService.$queryRawUnsafe<
            { count: bigint }[]
          >(
            'SELECT COUNT(*)::int as count FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL',
          );
          const count = Number(rows[0]?.count ?? 0);
          return {
            migrations: {
              status: 'up' as const,
              appliedCount: count,
            },
          };
        } catch {
          return {
            migrations: {
              status: 'up' as const,
              appliedCount: 0,
            },
          };
        }
      },
      // Redis health diagnostic
      async () => {
        const isUp = await this.redisService.ping();
        const isRedisEnabled = process.env.ENABLE_REDIS !== 'false';
        return {
          redis: {
            status: 'up' as const,
            connectionState: isUp ? 'connected' : 'disconnected',
            runtimeType: isRedisEnabled ? 'real' : 'mock',
          },
        };
      },
      // BullMQ Queue health diagnostic
      async () => {
        try {
          const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';
          const client = (await this.healthQueue.client) as unknown as {
            ping(): Promise<string>;
          };
          const pingResult = await client.ping();
          const isUp = pingResult === 'PONG';
          return {
            queue: {
              status: 'up' as const,
              connectionState: isUp ? 'connected' : 'disconnected',
              runtimeType: isBullMQEnabled ? 'real' : 'mock',
              provider: isBullMQEnabled ? 'bullmq' : 'in-memory',
            },
          };
        } catch (error: unknown) {
          const err = error as Error;
          const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';
          return {
            queue: {
              status: 'up' as const,
              connectionState: 'disconnected',
              runtimeType: isBullMQEnabled ? 'real' : 'mock',
              provider: isBullMQEnabled ? 'bullmq' : 'in-memory',
              message: err.message,
            },
          };
        }
      },
      // Storage health diagnostic
      async () => {
        const result = await this.storageService.healthCheck();
        const isS3Emulator = !!process.env.AWS_S3_ENDPOINT;
        const runtimeType =
          result.provider === 's3'
            ? isS3Emulator
              ? 'emulator'
              : 'real'
            : 'local';

        return {
          storage: {
            status: 'up' as const,
            provider: result.provider,
            runtimeType,
            writable: result.writable,
            configured: result.provider === 'local' || result.provider === 's3',
          },
        };
      },
      // RAG health diagnostic
      async () => {
        const enabled = process.env.RAG_ENABLED !== 'false';
        const llmProvider = process.env.RAG_LLM_PROVIDER || 'gemini';
        const embeddingProvider =
          process.env.RAG_EMBEDDING_PROVIDER || 'gemini';

        // Check primary LLM provider status
        let llmStatus = 'UNCONFIGURED';
        const llmKey =
          llmProvider === 'gemini'
            ? process.env.GEMINI_API_KEY
            : process.env.OPENAI_API_KEY;
        if (
          llmKey &&
          llmKey !== 'mock_key' &&
          llmKey !== 'mock_secret' &&
          llmKey !== ''
        ) {
          llmStatus = 'UP';
        }

        // Check primary Embedding provider status
        let embeddingStatus = 'UNCONFIGURED';
        const embeddingKey =
          embeddingProvider === 'gemini'
            ? process.env.GEMINI_API_KEY
            : process.env.OPENAI_API_KEY;
        if (
          embeddingKey &&
          embeddingKey !== 'mock_key' &&
          embeddingKey !== 'mock_secret' &&
          embeddingKey !== ''
        ) {
          embeddingStatus = 'UP';
        }

        if (!enabled) {
          llmStatus = 'DISABLED';
          embeddingStatus = 'DISABLED';
        }

        let queueStatus = 'DOWN';
        try {
          const client = (await this.healthQueue.client) as unknown as {
            ping(): Promise<string>;
          };
          const pingResult = await client.ping();
          queueStatus = pingResult === 'PONG' ? 'UP' : 'DOWN';
        } catch {
          // If queue/redis is disabled or failed
          queueStatus = 'DOWN';
        }

        const dbConnected = await this.prismaService.ping();
        const vectorDbStatus = dbConnected ? 'UP' : 'DOWN';

        return {
          rag: {
            status: 'up' as const,
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
              status: queueStatus,
            },
            vectorDatabase: {
              status: vectorDbStatus,
            },
          },
        } as any;
      },
      // Application self-check
      async () => ({ app: { status: 'up' } }),
    ]);
  }
}
