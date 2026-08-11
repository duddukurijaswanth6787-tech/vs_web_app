import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';

const imports = [];
const providers = [];
const exportsArray = [];

if (isBullMQEnabled) {
  imports.push(
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        prefix:
          configService.get<string>('app.bullmq.prefix') ||
          process.env.BULLMQ_PREFIX ||
          'vasanthi',
        connection: {
          host: configService.get<string>('app.redis.host', 'localhost'),
          port: configService.get<number>('app.redis.port', 6379),
          password: configService.get<string>('app.redis.password', ''),
          db: configService.get<number>('app.redis.db', 0),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'rag-ingestion',
    }),
    BullModule.registerQueue({
      name: 'report-export',
    }),
  );
  exportsArray.push(BullModule);
} else {
  // When BullMQ is disabled, provide dummy queue providers so injection doesn't crash
  const mockQueueProvider = {
    provide: 'BullQueue_rag-ingestion',
    useValue: {
      client: Promise.resolve({
        ping: async () => 'PONG',
      }),
    },
  };
  const mockReportQueueProvider = {
    provide: 'BullQueue_report-export',
    useValue: {
      add: async (name: string, data: any) => {
        console.log('Mock Queue: report-export job added:', name, data);
        return { id: 'mock-job-id' };
      },
      client: Promise.resolve({
        ping: async () => 'PONG',
      }),
    },
  };
  providers.push(mockQueueProvider, mockReportQueueProvider);
  exportsArray.push(mockQueueProvider, mockReportQueueProvider);
}

@Module({
  imports,
  providers,
  exports: exportsArray,
})
export class QueuesModule {}
