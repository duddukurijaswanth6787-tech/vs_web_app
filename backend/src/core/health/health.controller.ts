import { Controller, Get, Logger } from '@nestjs/common';
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
 * Helper to ensure an async health check function resolves within a timeout.
 */
/**
 * Deliberately generous: the database check is the only one that can fail this
 * endpoint, and a failed healthcheck fails the whole deploy. Distinguishing a
 * slow database from a dead one matters more here than answering quickly.
 */
const DB_PING_TIMEOUT_MS = 10_000;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T,
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timer),
  );
}

/**
 * Controller exposing the health verification endpoints of the application.
 * Executes diagnostics against database, cache, message queues, and memory.
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

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
        // 2s was too tight to survive a rollover: this is the only check that
        // can fail the endpoint, and Railway gates deploys on it. A new
        // container's first SELECT 1 has to open a connection and complete a
        // TLS handshake before it can run, so a momentarily slow -- not
        // broken -- database failed the healthcheck and the deploy with it,
        // while the previous container carried on serving. A genuine outage
        // still fails well inside Railway's 4-minute retry window.
        const isUp = await withTimeout(
          this.prismaService.ping(),
          DB_PING_TIMEOUT_MS,
          false,
        );
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
          const rows = await withTimeout(
            this.prismaService.$queryRawUnsafe<{ count: bigint }[]>(
              'SELECT COUNT(*)::int as count FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL',
            ),
            2000,
            [],
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
        const isUp = await withTimeout(this.redisService.ping(), 1500, false);
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
        const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';
        let isUp = false;
        try {
          if (isBullMQEnabled && this.healthQueue) {
            const queueCheck = async () => {
              const client = (await this.healthQueue.client) as unknown as {
                ping(): Promise<string>;
              };
              const pingResult = await client.ping();
              return pingResult === 'PONG';
            };
            isUp = await withTimeout(queueCheck(), 1500, false);
          }
        } catch (error) {
          this.logger.error(
            `BullMQ health check failed: ${error instanceof Error ? error.message : String(error)}`,
          );
          isUp = false;
        }

        return {
          queue: {
            status: 'up' as const,
            connectionState: isUp ? 'connected' : 'disconnected',
            runtimeType: isBullMQEnabled ? 'real' : 'mock',
            provider: isBullMQEnabled ? 'bullmq' : 'in-memory',
          },
        };
      },
      // Storage health diagnostic
      async () => {
        let result = { writable: true, provider: 'local', root: './storage' };
        try {
          result = await withTimeout(
            this.storageService.healthCheck(),
            1500,
            result,
          );
        } catch (error) {
          this.logger.error(
            `Storage health check failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

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
        let llmStatus = 'UP';
        const llmKey =
          process.env.GEMINI_API_KEY ||
          process.env.GOOGLE_API_KEY ||
          process.env.OPENAI_API_KEY;
        if (llmKey === 'mock_key' || llmKey === 'mock_secret') {
          llmStatus = 'MOCK';
        } else if (!llmKey && !enabled) {
          llmStatus = 'DISABLED';
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

        const dbConnected = await withTimeout(
          this.prismaService.ping(),
          1500,
          false,
        );
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
              status: dbConnected ? 'UP' : 'DOWN',
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
