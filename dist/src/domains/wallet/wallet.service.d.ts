import { AuditService } from "../audit/audit.service";
import { CustomerProfileRepository } from "../customer-profile/customer-profile.repository";
import { WalletRepository } from './wallet.repository';
import { CreditWalletDto, DebitWalletDto, WalletTransactionQueryDto } from './wallet.types';
export declare class WalletService {
    private readonly walletRepository;
    private readonly profileRepository;
    private readonly auditService;
    constructor(walletRepository: WalletRepository, profileRepository: CustomerProfileRepository, auditService: AuditService);
    getOrCreateWallet(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        currency: string;
        customerId: string;
        balance: import("@prisma/client-runtime-utils").Decimal;
    }>;
    getBalance(userId: string): Promise<{
        balance: number;
        currency: string;
    }>;
    credit(userId: string, dto: CreditWalletDto): Promise<{
        balance: number;
        transaction: {
            id: string;
            type: string;
            amount: number;
            balanceAfter: number;
            description: string | undefined;
            referenceType: string | undefined;
            referenceId: string | undefined;
            createdAt: Date;
        };
    }>;
    debit(userId: string, dto: DebitWalletDto): Promise<{
        balance: number;
        transaction: {
            id: string;
            type: string;
            amount: number;
            balanceAfter: number;
            description: string | undefined;
            referenceType: string | undefined;
            referenceId: string | undefined;
            createdAt: Date;
        };
    }>;
    getTransactions(userId: string, query: WalletTransactionQueryDto): Promise<{
        data: {
            id: string;
            type: string;
            amount: number;
            balanceAfter: number;
            referenceType: string | undefined;
            referenceId: string | undefined;
            description: string | undefined;
            createdAt: Date;
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
    getOrCreateWalletByCustomerId(customerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        currency: string;
        customerId: string;
        balance: import("@prisma/client-runtime-utils").Decimal;
    }>;
    getTransactionsByCustomerIdAdmin(customerId: string, query: WalletTransactionQueryDto): Promise<{
        data: {
            id: string;
            type: string;
            amount: number;
            balanceAfter: number;
            referenceType: string | undefined;
            referenceId: string | undefined;
            description: string | undefined;
            createdAt: Date;
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
    creditByCustomerIdAdmin(customerId: string, dto: CreditWalletDto, adminUserId: string): Promise<{
        balance: number;
        transaction: {
            id: string;
            type: string;
            amount: number;
            balanceAfter: number;
            description: string | undefined;
            createdAt: Date;
        };
    }>;
    debitByCustomerIdAdmin(customerId: string, dto: DebitWalletDto, adminUserId: string): Promise<{
        balance: number;
        transaction: {
            id: string;
            type: string;
            amount: number;
            balanceAfter: number;
            description: string | undefined;
            createdAt: Date;
        };
    }>;
}
