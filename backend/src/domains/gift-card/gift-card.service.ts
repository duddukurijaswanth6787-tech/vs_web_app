import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import {
  CreateGiftCardDto,
  PurchaseGiftCardDto,
  RedeemGiftCardDto,
} from './gift-card.types';
import * as crypto from 'crypto';

@Injectable()
export class GiftCardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private generateCode(): string {
    return `GC${crypto.randomBytes(4).toString('hex').toUpperCase()}${Date.now().toString().slice(-4)}`;
  }

  private toResponse(card: any) {
    return {
      id: card.id,
      code: card.code,
      initialAmount: Number(card.initialAmount),
      balance: Number(card.balance),
      currency: card.currency,
      status: card.status,
      recipientEmail: card.recipientEmail ?? undefined,
      recipientPhone: card.recipientPhone ?? undefined,
      expiresAt: card.expiresAt ?? undefined,
      createdAt: card.createdAt,
    };
  }

  private async getProfile(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CUSTOMER_001');
    return profile;
  }

  async createAdmin(dto: CreateGiftCardDto, adminId: string) {
    const code = dto.code?.toUpperCase() || this.generateCode();
    const existing = await this.prisma.giftCard.findUnique({ where: { code } });
    if (existing)
      throw new BusinessException(
        'Gift card code already exists',
        'GIFTCARD_001',
      );
    const card = await this.prisma.giftCard.create({
      data: {
        code,
        initialAmount: dto.amount,
        balance: dto.amount,
        recipientEmail: dto.recipientEmail,
        recipientPhone: dto.recipientPhone,
        message: dto.message,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: adminId,
        status: 'ACTIVE',
      },
    });
    await this.auditService.log({
      action: 'GIFTCARD_CREATED',
      module: 'gift-card',
      resource: 'gift_card',
      resourceId: card.id,
      userId: adminId,
      newValue: { code, amount: dto.amount },
    });
    return this.toResponse(card);
  }

  async purchase(userId: string, dto: PurchaseGiftCardDto) {
    const profile = await this.getProfile(userId);
    const code = this.generateCode();
    const card = await this.prisma.giftCard.create({
      data: {
        code,
        initialAmount: dto.amount,
        balance: dto.amount,
        purchaserId: profile.id,
        recipientEmail: dto.recipientEmail,
        recipientPhone: dto.recipientPhone,
        message: dto.message,
        status: 'ACTIVE',
      },
    });
    await this.auditService.log({
      action: 'GIFTCARD_PURCHASED',
      module: 'gift-card',
      resource: 'gift_card',
      resourceId: card.id,
      userId,
      newValue: { code, amount: dto.amount },
    });
    return this.toResponse(card);
  }

  async getBalance(code: string) {
    const card = await this.prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!card)
      throw new BusinessException('Gift card not found', 'GIFTCARD_002');
    return this.toResponse(card);
  }

  async redeem(userId: string, dto: RedeemGiftCardDto) {
    const profile = await this.getProfile(userId);
    const card = await this.prisma.giftCard.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (!card)
      throw new BusinessException('Gift card not found', 'GIFTCARD_002');
    if (card.status !== 'ACTIVE')
      throw new BusinessException('Gift card is not active', 'GIFTCARD_003');
    if (card.expiresAt && card.expiresAt < new Date()) {
      await this.prisma.giftCard.update({
        where: { id: card.id },
        data: { status: 'EXPIRED' },
      });
      throw new BusinessException('Gift card expired', 'GIFTCARD_004');
    }
    const balance = Number(card.balance);
    if (balance < dto.amount)
      throw new BusinessException(
        'Insufficient gift card balance',
        'GIFTCARD_005',
      );
    const balanceAfter = balance - dto.amount;
    const [updated] = await this.prisma.$transaction([
      this.prisma.giftCard.update({
        where: { id: card.id },
        data: {
          balance: balanceAfter,
          status: balanceAfter <= 0 ? 'REDEEMED' : 'ACTIVE',
        },
      }),
      this.prisma.giftCardRedemption.create({
        data: {
          giftCardId: card.id,
          customerId: profile.id,
          amount: dto.amount,
          orderId: dto.orderId,
          balanceAfter,
        },
      }),
    ]);
    await this.auditService.log({
      action: 'GIFTCARD_REDEEMED',
      module: 'gift-card',
      resource: 'gift_card',
      resourceId: card.id,
      userId,
      newValue: { amount: dto.amount, balanceAfter },
    });
    return this.toResponse(updated);
  }

  async listAdmin(page = 1, limit = 20) {
    const take = Math.min(limit, 100);
    const [data, total] = await Promise.all([
      this.prisma.giftCard.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.giftCard.count(),
    ]);
    return {
      data: data.map((c) => this.toResponse(c)),
      meta: { page, limit: take, total },
    };
  }
}
