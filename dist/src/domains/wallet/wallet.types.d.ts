export declare class CreditWalletDto {
    amount: number;
    description?: string;
    referenceType?: string;
    referenceId?: string;
}
export declare class DebitWalletDto {
    amount: number;
    description?: string;
    referenceType?: string;
    referenceId?: string;
}
export declare class WalletTransactionQueryDto {
    type?: string;
    page?: number;
    limit?: number;
}
export declare class WalletTransactionResponse {
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
    createdAt: Date;
}
export declare class WalletResponse {
    id: string;
    customerId: string;
    balance: number;
    currency: string;
    isActive: boolean;
    createdAt: Date;
}
