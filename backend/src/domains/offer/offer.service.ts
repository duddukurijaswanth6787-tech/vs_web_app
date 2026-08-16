import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { OfferRepository } from './offer.repository';
import {
  CreateOfferDto,
  UpdateOfferDto,
  OfferQueryDto,
  OfferResponse,
} from './offer.types';

@Injectable()
export class OfferService {
  constructor(
    private readonly offerRepository: OfferRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(o: any): OfferResponse {
    return {
      id: o.id,
      name: o.name,
      description: o.description ?? undefined,
      type: o.type,
      value: Number(o.value),
      minOrderAmount: o.minOrderAmount ? Number(o.minOrderAmount) : undefined,
      maxDiscountAmount: o.maxDiscountAmount
        ? Number(o.maxDiscountAmount)
        : undefined,
      applicableTo: o.applicableTo ?? undefined,
      applicableIds: o.applicableIds ?? undefined,
      priority: o.priority,
      startDate: o.startDate,
      endDate: o.endDate,
      isActive: o.isActive,
      createdAt: o.createdAt,
    };
  }

  async findAll(query: OfferQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.offerRepository.findAll({
      search: query.search,
      isActive: query.isActive,
      type: query.type,
      page,
      limit,
    });
    return {
      data: result.data.map((o) => this.toResponse(o)),
      meta: result.meta,
    };
  }

  async findById(id: string) {
    const offer = await this.offerRepository.findById(id);
    if (!offer) throw new BusinessException('Offer not found', 'OFFER_001');
    return this.toResponse(offer);
  }

  async getActiveOffers() {
    const offers = await this.offerRepository.findActiveOffers();
    return offers.map((o) => this.toResponse(o));
  }

  async create(userId: string, dto: CreateOfferDto) {
    const offer = await this.offerRepository.create({
      name: dto.name,
      description: dto.description,
      type: dto.type,
      value: dto.value,
      minOrderAmount: dto.minOrderAmount,
      maxDiscountAmount: dto.maxDiscountAmount,
      applicableTo: dto.applicableTo,
      applicableIds: dto.applicableIds ?? [],
      priority: dto.priority ?? 0,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      createdBy: userId,
    });
    await this.auditService.log({
      action: 'OFFER_CREATED',
      module: 'OFFER',
      resource: 'Offer',
      resourceId: offer.id,
      userId,
    });
    return this.toResponse(offer);
  }

  async update(id: string, dto: UpdateOfferDto, userId: string) {
    const existing = await this.offerRepository.findById(id);
    if (!existing) throw new BusinessException('Offer not found', 'OFFER_001');
    const offer = await this.offerRepository.update(id, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      updatedBy: userId,
    });
    return this.toResponse(offer);
  }

  calculateDiscount(
    orderItems: {
      productId: string;
      categoryId?: string;
      brandId?: string;
      price: number;
      quantity: number;
    }[],
    activeOffers: any[],
  ): { offerId: string; discount: number } | null {
    if (!activeOffers.length) return null;

    let bestDiscount = 0;
    let bestOffer: any = null;

    for (const offer of activeOffers) {
      let applicableTotal = 0;
      for (const item of orderItems) {
        if (this.isItemApplicable(item, offer)) {
          applicableTotal += item.price * item.quantity;
        }
      }
      if (applicableTotal === 0) continue;
      if (
        offer.minOrderAmount &&
        applicableTotal < Number(offer.minOrderAmount)
      )
        continue;

      let discount = 0;
      if (
        offer.type === 'PRODUCT' ||
        offer.type === 'FESTIVAL' ||
        offer.type === 'FLASH_SALE'
      ) {
        discount = applicableTotal * (Number(offer.value) / 100);
      } else {
        discount = applicableTotal * (Number(offer.value) / 100);
      }
      if (offer.maxDiscountAmount) {
        discount = Math.min(discount, Number(offer.maxDiscountAmount));
      }
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    }

    if (!bestOffer || bestDiscount === 0) return null;
    return { offerId: bestOffer.id, discount: bestDiscount };
  }

  private isItemApplicable(
    item: { productId: string; categoryId?: string; brandId?: string },
    offer: any,
  ): boolean {
    if (!offer.applicableTo) return true;
    const ids: string[] = offer.applicableIds ?? [];
    if (!ids.length) return true;
    // Admin form sends the plural forms (PRODUCTS/CATEGORIES/BRANDS/GLOBAL);
    // accept both so this doesn't silently no-op on casing alone.
    switch (offer.applicableTo) {
      case 'PRODUCT':
      case 'PRODUCTS':
        return ids.includes(item.productId);
      case 'CATEGORY':
      case 'CATEGORIES':
        return !!item.categoryId && ids.includes(item.categoryId);
      case 'BRAND':
      case 'BRANDS':
        return !!item.brandId && ids.includes(item.brandId);
      default:
        return true;
    }
  }
}
