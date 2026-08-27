import { AuditService } from "../audit/audit.service";
import { OfferRepository } from './offer.repository';
import { CreateOfferDto, UpdateOfferDto, OfferQueryDto, OfferResponse } from './offer.types';
export declare class OfferService {
    private readonly offerRepository;
    private readonly auditService;
    constructor(offerRepository: OfferRepository, auditService: AuditService);
    private toResponse;
    findAll(query: OfferQueryDto): Promise<{
        data: OfferResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<OfferResponse>;
    getActiveOffers(): Promise<OfferResponse[]>;
    create(userId: string, dto: CreateOfferDto): Promise<OfferResponse>;
    update(id: string, dto: UpdateOfferDto, userId: string): Promise<OfferResponse>;
    calculateDiscount(orderItems: {
        productId: string;
        categoryId?: string;
        brandId?: string;
        price: number;
        quantity: number;
    }[], activeOffers: any[]): {
        offerId: string;
        discount: number;
    } | null;
    private isItemApplicable;
}
