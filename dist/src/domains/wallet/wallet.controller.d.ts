import { WalletService } from './wallet.service';
import { CreditWalletDto, DebitWalletDto, WalletTransactionQueryDto } from './wallet.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getWallet(user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        customerId: string;
        balance: number;
        currency: string;
        isActive: boolean;
        createdAt: Date;
    }>>;
    getTransactions(user: JwtPayload, query: WalletTransactionQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    credit(dto: CreditWalletDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    debit(dto: DebitWalletDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getWalletAdmin(customerId: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        customerId: string;
        balance: number;
        currency: string;
        isActive: boolean;
        createdAt: Date;
    }>>;
    getTransactionsAdmin(customerId: string, query: WalletTransactionQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    creditAdmin(customerId: string, dto: CreditWalletDto, admin: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        balance: number;
        transaction: {
            id: string;
            type: string;
            amount: number;
            balanceAfter: number;
            description: string | undefined;
            createdAt: Date;
        };
    }>>;
    debitAdmin(customerId: string, dto: DebitWalletDto, admin: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        balance: number;
        transaction: {
            id: string;
            type: string;
            amount: number;
            balanceAfter: number;
            description: string | undefined;
            createdAt: Date;
        };
    }>>;
}
