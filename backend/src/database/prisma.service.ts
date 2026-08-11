import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { DATABASE_CONSTANTS } from './database.constants';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private connected = false;
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const url = configService.get<string>('app.database.url') || '';
    const adapter = new PrismaPg({ connectionString: url });
    const env = configService.get<string>('app.env', 'development');
    super({
      adapter,
      log: [
        // ponytail: query logs only when PRISMA_QUERY_LOGS=true
        ...(env !== 'production' && process.env.PRISMA_QUERY_LOGS === 'true'
          ? [{ emit: 'event' as const, level: 'query' as const }]
          : []),
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    const maxRetries = DATABASE_CONSTANTS.RETRY_COUNT;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.connected = true;
        this.setupEventListeners();
        return;
      } catch (error) {
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10_000);
          this.logger.warn(
            `Database connection attempt ${attempt + 1} failed. Retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          this.logger.error(
            'Failed to connect to PostgreSQL database after retries',
            error instanceof Error ? error.message : String(error),
          );
          process.exit(1);
        }
      }
    }
  }

  private setupEventListeners() {
    const client = this as unknown as {
      $on(
        event: 'query' | 'info' | 'warn' | 'error',
        callback: (event: {
          query?: string;
          params?: string;
          duration?: number;
          message?: string;
        }) => void,
      ): void;
    };
    const slowQueryThreshold = this.configService.get<number>(
      'app.database.slowQueryThreshold',
      DATABASE_CONSTANTS.SLOW_QUERY_THRESHOLD,
    );

    client.$on('query', (e) => {
      const duration = e.duration || 0;
      if (duration > slowQueryThreshold) {
        this.logger.warn(
          `Slow query (${duration}ms): ${e.query}`,
          'PrismaSlowQuery',
        );
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

  async ping(): Promise<boolean> {
    try {
      await this.$executeRawUnsafe('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  get isConnected(): boolean {
    return this.connected;
  }
}
