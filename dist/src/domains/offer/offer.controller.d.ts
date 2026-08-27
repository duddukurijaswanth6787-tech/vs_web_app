import { OfferService } from './offer.service';
import { CreateOfferDto, UpdateOfferDto, OfferQueryDto } from './offer.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class OfferController {
    private readonly offerService;
    constructor(offerService: OfferService);
    findAll(query: OfferQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./offer.types").OfferResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getActiveOffers(): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./offer.types").OfferResponse[]>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./offer.types").OfferResponse>>;
    create(dto: CreateOfferDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./offer.types").OfferResponse>>;
    update(id: string, dto: UpdateOfferDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./offer.types").OfferResponse>>;
}
