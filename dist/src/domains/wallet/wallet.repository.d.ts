import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class WalletRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByCustomerId(customerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        currency: string;
        customerId: string;
        balance: Prisma.Decimal;
    } | null>;
    create(customerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        currency: string;
        customerId: string;
        balance: Prisma.Decimal;
    }>;
    updateBalance(walletId: string, amount: number, type: string, description?: string, referenceType?: string, referenceId?: string): Promise<{
        wallet: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            currency: string;
            customerId: string;
            balance: Prisma.Decimal;
        };
        transaction: {
            id: string;
            description: string | null;
            createdBy: string | null;
            createdAt: Date;
            type: string;
            amount: Prisma.Decimal;
            referenceType: string | null;
            referenceId: string | null;
            balanceAfter: Prisma.Decimal;
            walletId: string;
        };
    }>;
    getTransactions(walletId: string, params: {
        type?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            description: string | null;
            createdBy: string | null;
            createdAt: Date;
            type: string;
            amount: Prisma.Decimal;
            referenceType: string | null;
            referenceId: string | null;
            balanceAfter: Prisma.Decimal;
            walletId: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getBalance(walletId: string): Promise<Prisma.Decimal | undefined>;
}
