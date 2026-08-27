import { GiftCardService } from './gift-card.service';
import { CreateGiftCardDto, PurchaseGiftCardDto, RedeemGiftCardDto, GiftCardBalanceDto } from './gift-card.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class GiftCardController {
    private readonly giftCardService;
    constructor(giftCardService: GiftCardService);
    purchase(user: JwtPayload, dto: PurchaseGiftCardDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: any;
        code: any;
        initialAmount: number;
        balance: number;
        currency: any;
        status: any;
        recipientEmail: any;
        recipientPhone: any;
        expiresAt: any;
        createdAt: any;
    }>>;
    redeem(user: JwtPayload, dto: RedeemGiftCardDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: any;
        code: any;
        initialAmount: number;
        balance: number;
        currency: any;
        status: any;
        recipientEmail: any;
        recipientPhone: any;
        expiresAt: any;
        createdAt: any;
    }>>;
    balance(dto: GiftCardBalanceDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: any;
        code: any;
        initialAmount: number;
        balance: number;
        currency: any;
        status: any;
        recipientEmail: any;
        recipientPhone: any;
        expiresAt: any;
        createdAt: any;
    }>>;
    create(user: JwtPayload, dto: CreateGiftCardDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: any;
        code: any;
        initialAmount: number;
        balance: number;
        currency: any;
        status: any;
        recipientEmail: any;
        recipientPhone: any;
        expiresAt: any;
        createdAt: any;
    }>>;
    list(page?: string, limit?: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: {
            id: any;
            code: any;
            initialAmount: number;
            balance: number;
            currency: any;
            status: any;
            recipientEmail: any;
            recipientPhone: any;
            expiresAt: any;
            createdAt: any;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>>;
}
