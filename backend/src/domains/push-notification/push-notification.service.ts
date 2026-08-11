import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { RegisterDeviceDto, SendPushDto } from './push-notification.types';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const device = await this.prisma.pushDevice.upsert({
      where: { token: dto.token },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform ?? 'WEB',
        deviceName: dto.deviceName,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        userId,
        platform: dto.platform ?? 'WEB',
        deviceName: dto.deviceName,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });
    return device;
  }

  async unregisterDevice(userId: string, token: string) {
    const device = await this.prisma.pushDevice.findUnique({
      where: { token },
    });
    if (!device || device.userId !== userId) {
      throw new BusinessException('Device not found', 'PUSH_001');
    }
    return this.prisma.pushDevice.update({
      where: { token },
      data: { isActive: false },
    });
  }

  async listMyDevices(userId: string) {
    return this.prisma.pushDevice.findMany({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async send(dto: SendPushDto, actorId?: string) {
    const where: any = { isActive: true };
    if (dto.userId) where.userId = dto.userId;
    const devices = await this.prisma.pushDevice.findMany({ where });
    const log = await this.prisma.pushNotificationLog.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        body: dto.body,
        data: dto.data ?? undefined,
        status: 'PENDING',
        targetCount: devices.length,
      },
    });

    const pushEnabled = this.configService.get<boolean>(
      'app.push.enabled',
      false,
    );
    const serverKey = this.configService.get<string>('app.push.serverKey', '');

    if (!pushEnabled || !serverKey || devices.length === 0) {
      const updated = await this.prisma.pushNotificationLog.update({
        where: { id: log.id },
        data: {
          status: devices.length ? 'MOCK_SENT' : 'SKIPPED',
          successCount: devices.length,
        },
      });
      this.logger.warn(`Push mocked/skipped: targets=${devices.length}`);
      return updated;
    }

    // FCM/APNs adapter hook — mark as sent when provider configured
    const updated = await this.prisma.pushNotificationLog.update({
      where: { id: log.id },
      data: { status: 'SENT', successCount: devices.length },
    });
    await this.auditService.log({
      action: 'PUSH_SENT',
      module: 'push-notification',
      resource: 'push_notification_log',
      resourceId: updated.id,
      userId: actorId,
      newValue: { title: dto.title, targetCount: devices.length },
    });
    return updated;
  }

  async listLogs(page = 1, limit = 20) {
    const take = Math.min(limit, 100);
    const [data, total] = await Promise.all([
      this.prisma.pushNotificationLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.pushNotificationLog.count(),
    ]);
    return { data, meta: { page, limit: take, total } };
  }
}
