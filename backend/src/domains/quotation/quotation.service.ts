import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { PosService } from '@domains/pos/pos.service';
import {
  PosPaymentMethodType,
  type CompletePosSaleDto,
} from '@domains/pos/pos.types';
import {
  buildQuotationNumber,
  computeQuotation,
  type QuotationLineInput,
} from './quotation.math';
import type {
  ConvertQuotationDto,
  CreateQuotationDto,
  QuotationItemDto,
  UpdateQuotationDto,
} from './quotation.types';

/** Statuses a quote can still be edited in. */
const EDITABLE = ['DRAFT', 'SENT'];

@Injectable()
export class QuotationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly posService: PosService,
  ) {}

  private lineInputs(items: QuotationItemDto[]): QuotationLineInput[] {
    return items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent,
      taxPercent: i.taxPercent,
    }));
  }

  async create(userId: string, dto: CreateQuotationDto) {
    if (!dto.items?.length) {
      throw new BusinessException(
        'A quotation needs at least one product line',
        'QUOTATION_EMPTY',
      );
    }

    const totals = computeQuotation(this.lineInputs(dto.items));

    return this.prisma.quotation.create({
      data: {
        quotationNumber: buildQuotationNumber(),
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        status: dto.status ?? 'DRAFT',
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
        notes: dto.notes,
        termsText: dto.termsText,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        createdBy: userId,
        items: {
          create: dto.items.map((item, idx) => ({
            productId: item.productId,
            variantId: item.variantId,
            // Copied, not joined: the quote must still print what was agreed
            // after the product is renamed.
            productName: item.productName,
            variantTitle: item.variantTitle,
            sku: item.sku ?? '',
            quantity: totals.lines[idx].quantity,
            unitPrice: totals.lines[idx].unitPrice,
            discountPercent: totals.lines[idx].discountPercent,
            discountAmount: totals.lines[idx].discountAmount,
            taxPercent: totals.lines[idx].taxPercent,
            taxAmount: totals.lines[idx].taxAmount,
            totalPrice: totals.lines[idx].totalPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  async list(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));

    const where: any = { deletedAt: null };
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { quotationNumber: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
        { customerPhone: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return {
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
      },
    };
  }

  async get(id: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!quotation) {
      throw new BusinessException('Quotation not found', 'QUOTATION_NOT_FOUND');
    }
    return quotation;
  }

  async update(userId: string, id: string, dto: UpdateQuotationDto) {
    const existing = await this.get(id);

    // A converted quote is the record of what was actually sold. Editing it
    // would rewrite the terms of a completed transaction.
    if (!EDITABLE.includes(existing.status)) {
      throw new BusinessException(
        `A ${existing.status.toLowerCase()} quotation can no longer be edited`,
        'QUOTATION_LOCKED',
      );
    }

    const items = dto.items ?? [];
    const totals = computeQuotation(this.lineInputs(items));

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      }
      return tx.quotation.update({
        where: { id },
        data: {
          customerId: dto.customerId ?? existing.customerId,
          customerName: dto.customerName ?? existing.customerName,
          customerPhone: dto.customerPhone ?? existing.customerPhone,
          customerEmail: dto.customerEmail ?? existing.customerEmail,
          status: dto.status ?? existing.status,
          notes: dto.notes ?? existing.notes,
          termsText: dto.termsText ?? existing.termsText,
          validUntil: dto.validUntil
            ? new Date(dto.validUntil)
            : existing.validUntil,
          updatedBy: userId,
          ...(dto.items && {
            subtotal: totals.subtotal,
            discountTotal: totals.discountTotal,
            taxTotal: totals.taxTotal,
            grandTotal: totals.grandTotal,
            items: {
              create: items.map((item, idx) => ({
                productId: item.productId,
                variantId: item.variantId,
                productName: item.productName,
                variantTitle: item.variantTitle,
                sku: item.sku ?? '',
                quantity: totals.lines[idx].quantity,
                unitPrice: totals.lines[idx].unitPrice,
                discountPercent: totals.lines[idx].discountPercent,
                discountAmount: totals.lines[idx].discountAmount,
                taxPercent: totals.lines[idx].taxPercent,
                taxAmount: totals.lines[idx].taxAmount,
                totalPrice: totals.lines[idx].totalPrice,
              })),
            },
          }),
        },
        include: { items: true },
      });
    });
  }

  async cancel(userId: string, id: string) {
    const existing = await this.get(id);
    if (existing.status === 'CONVERTED') {
      throw new BusinessException(
        'This quotation has already been sold and cannot be cancelled',
        'QUOTATION_ALREADY_CONVERTED',
      );
    }
    return this.prisma.quotation.update({
      where: { id },
      data: { status: 'CANCELLED', updatedBy: userId },
      include: { items: true },
    });
  }

  /**
   * Turns an accepted quote into a real POS sale.
   *
   * Deliberately goes through the till's own completeSale rather than writing
   * an order here: that path already enforces the open-shift rule, checks
   * stock, deducts it atomically and logs the movement. Duplicating any of it
   * would mean a second, less-tested way to take money and move inventory.
   */
  async convert(userId: string, id: string, dto: ConvertQuotationDto) {
    const quotation = await this.get(id);

    // convertedOrderId is unique, but checking here turns a double-click into
    // a clear answer rather than a constraint violation.
    if (quotation.status === 'CONVERTED' || quotation.convertedOrderId) {
      throw new BusinessException(
        `Quotation ${quotation.quotationNumber} has already been converted`,
        'QUOTATION_ALREADY_CONVERTED',
      );
    }
    if (quotation.status === 'CANCELLED') {
      throw new BusinessException(
        'A cancelled quotation cannot be sold',
        'QUOTATION_CANCELLED',
      );
    }
    if (!quotation.items.length) {
      throw new BusinessException(
        'This quotation has no products to sell',
        'QUOTATION_EMPTY',
      );
    }
    if (quotation.validUntil && quotation.validUntil.getTime() < Date.now()) {
      throw new BusinessException(
        `Quotation ${quotation.quotationNumber} expired on ${quotation.validUntil.toISOString().slice(0, 10)}. Re-price it before selling.`,
        'QUOTATION_EXPIRED',
      );
    }

    const sale: CompletePosSaleDto = {
      items: quotation.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        productName: item.productName,
        variantTitle: item.variantTitle ?? undefined,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount),
      })),
      paymentMethod: dto.paymentMethod as PosPaymentMethodType,
      amountPaid: dto.amountPaid,
      customer: {
        name: quotation.customerName,
        phone: quotation.customerPhone ?? undefined,
        email: quotation.customerEmail ?? undefined,
      },
      terminalId: dto.terminalId,
      discountTotal: Number(quotation.discountTotal),
      taxTotal: Number(quotation.taxTotal),
      notes: `Converted from quotation ${quotation.quotationNumber}`,
    } as CompletePosSaleDto;

    const result = await this.posService.completeSale(userId, sale);
    const orderId = result?.order?.orderId;

    // Recorded only after the sale really committed, so a failed till run
    // leaves the quote open rather than marking it sold with no order.
    return this.prisma.quotation.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedOrderId: orderId,
        convertedAt: new Date(),
        terminalId: dto.terminalId,
        updatedBy: userId,
      },
      include: { items: true },
    });
  }
}
