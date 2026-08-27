import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateGiftCardDto, PurchaseGiftCardDto, RedeemGiftCardDto } from './gift-card.types';
export declare class GiftCardService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    private generateCode;
    private toResponse;
    private getProfile;
    createAdmin(dto: CreateGiftCardDto, adminId: string): Promise<{
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
    }>;
    purchase(userId: string, dto: PurchaseGiftCardDto): Promise<{
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
    }>;
    getBalance(code: string): Promise<{
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
    }>;
    redeem(userId: string, dto: RedeemGiftCardDto): Promise<{
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
    }>;
    listAdmin(page?: number, limit?: number): Promise<{
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
    }>;
}
