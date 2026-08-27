"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const offer_repository_1 = require("./offer.repository");
let OfferService = class OfferService {
    offerRepository;
    auditService;
    constructor(offerRepository, auditService) {
        this.offerRepository = offerRepository;
        this.auditService = auditService;
    }
    toResponse(o) {
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
    async findAll(query) {
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
    async findById(id) {
        const offer = await this.offerRepository.findById(id);
        if (!offer)
            throw new exceptions_1.BusinessException('Offer not found', 'OFFER_001');
        return this.toResponse(offer);
    }
    async getActiveOffers() {
        const offers = await this.offerRepository.findActiveOffers();
        return offers.map((o) => this.toResponse(o));
    }
    async create(userId, dto) {
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
    async update(id, dto, userId) {
        const existing = await this.offerRepository.findById(id);
        if (!existing)
            throw new exceptions_1.BusinessException('Offer not found', 'OFFER_001');
        const offer = await this.offerRepository.update(id, {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            updatedBy: userId,
        });
        return this.toResponse(offer);
    }
    calculateDiscount(orderItems, activeOffers) {
        if (!activeOffers.length)
            return null;
        let bestDiscount = 0;
        let bestOffer = null;
        for (const offer of activeOffers) {
            let applicableTotal = 0;
            for (const item of orderItems) {
                if (this.isItemApplicable(item, offer)) {
                    applicableTotal += item.price * item.quantity;
                }
            }
            if (applicableTotal === 0)
                continue;
            if (offer.minOrderAmount &&
                applicableTotal < Number(offer.minOrderAmount))
                continue;
            let discount = 0;
            if (offer.type === 'PRODUCT' ||
                offer.type === 'FESTIVAL' ||
                offer.type === 'FLASH_SALE') {
                discount = applicableTotal * (Number(offer.value) / 100);
            }
            else {
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
        if (!bestOffer || bestDiscount === 0)
            return null;
        return { offerId: bestOffer.id, discount: bestDiscount };
    }
    isItemApplicable(item, offer) {
        if (!offer.applicableTo)
            return true;
        const ids = offer.applicableIds ?? [];
        if (!ids.length)
            return true;
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
};
exports.OfferService = OfferService;
exports.OfferService = OfferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [offer_repository_1.OfferRepository,
        audit_service_1.AuditService])
], OfferService);
//# sourceMappingURL=offer.service.js.map