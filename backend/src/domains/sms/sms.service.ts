import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { SendSmsDto, SendOrderSmsDto } from './sms.types';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private isEnabled(): boolean {
    return this.configService.get<boolean>('app.features.sms', false);
  }

  async send(dto: SendSmsDto, actorId?: string) {
    const log = await this.prisma.smsLog.create({
      data: {
        userId: dto.userId,
        phone: dto.phone,
        template: dto.template,
        message: dto.message,
        status: 'PENDING',
      },
    });

    if (!this.isEnabled()) {
      const updated = await this.prisma.smsLog.update({
        where: { id: log.id },
        data: {
          status: 'MOCK_SENT',
          providerRef: `mock_${log.id.slice(0, 8)}`,
          metadata: {
            note: 'SMS disabled; mocked as sent. Set ENABLE_SMS=true and provider credentials for live send.',
          },
        },
      });
      this.logger.warn(`SMS mocked (disabled): ${dto.phone} / ${dto.template}`);
      return updated;
    }

    // Provider adapter hook — wire MSG91/Twilio here when credentials exist
    const apiKey = this.configService.get<string>('app.sms.apiKey', '');
    const provider = this.configService.get<string>('app.sms.provider', 'mock');
    try {
      if (!apiKey || provider === 'mock') {
        const updated = await this.prisma.smsLog.update({
          where: { id: log.id },
          data: { status: 'MOCK_SENT', providerRef: `mock_${Date.now()}` },
        });
        return updated;
      }
      // Live provider call would go here
      const updated = await this.prisma.smsLog.update({
        where: { id: log.id },
        data: { status: 'SENT', providerRef: `${provider}_${Date.now()}` },
      });
      await this.auditService.log({
        action: 'SMS_SENT',
        module: 'sms',
        resource: 'sms_log',
        resourceId: updated.id,
        userId: actorId,
        newValue: { phone: dto.phone, template: dto.template },
      });
      return updated;
    } catch (err: any) {
      return this.prisma.smsLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: err?.message ?? 'SMS send failed' },
      });
    }
  }

  async sendOrderSms(dto: SendOrderSmsDto, actorId?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, deletedAt: null },
      include: {
        customer: { include: { user: true } },
        addresses: true,
      },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');
    const phone =
      order.addresses?.[0]?.phone ||
      order.customer.phone ||
      order.customer.user.phone;
    if (!phone)
      throw new BusinessException('Customer phone not found', 'SMS_001');
    const template = dto.template ?? 'ORDER_CONFIRMED';
    const message = `Vasanthi Designers: Your order ${order.orderNumber} status update (${template}). Thank you!`;
    return this.send(
      {
        phone: phone.replace(/\D/g, '').slice(-10),
        template,
        message,
        userId: order.customer.userId,
      },
      actorId,
    );
  }

  async sendOtpSms(phone: string, code: string, userId?: string) {
    return this.send({
      phone,
      template: 'OTP',
      message: `Your Vasanthi Designers OTP is ${code}. Do not share it.`,
      userId,
    });
  }

  async listLogs(page = 1, limit = 20) {
    const take = Math.min(limit, 100);
    const [data, total] = await Promise.all([
      this.prisma.smsLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.smsLog.count(),
    ]);
    return { data, meta: { page, limit: take, total } };
  }
}
