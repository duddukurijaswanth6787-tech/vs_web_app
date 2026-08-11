import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';

export interface SystemHealth {
  postgres: string;
  prisma: string;
  migration: string;
  redis: string;
  queue: string;
  storage: string;
  socket: string;
  scheduler: string;
}

@Injectable()
export class StartupHealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async getSystemHealth(): Promise<SystemHealth> {
    const redisEnabled = this.configService.get<boolean>(
      'app.features.redis',
      true,
    );
    const queueEnabled = this.configService.get<boolean>(
      'app.features.bullmq',
      true,
    );
    const storageProvider = this.configService.get<string>(
      'app.storage.provider',
      'local',
    );

    return {
      postgres: this.prismaService.isConnected ? 'Connected' : 'Disconnected',
      prisma: this.prismaService.isConnected ? 'Ready' : 'Unavailable',
      migration: 'Up-to-date',
      redis: redisEnabled ? 'Enabled' : 'Disabled',
      queue: queueEnabled ? 'Enabled' : 'Disabled',
      storage: storageProvider === 's3' ? 'AWS S3' : 'Local',
      socket: 'Enabled',
      scheduler: 'Running',
    };
  }
}
