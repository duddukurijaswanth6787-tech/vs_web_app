export declare class CreateGiftCardDto {
    amount: number;
    recipientEmail?: string;
    recipientPhone?: string;
    message?: string;
    expiresAt?: string;
    code?: string;
}
export declare class PurchaseGiftCardDto {
    amount: number;
    recipientEmail?: string;
    recipientPhone?: string;
    message?: string;
}
export declare class RedeemGiftCardDto {
    code: string;
    amount: number;
    orderId?: string;
}
export declare class GiftCardBalanceDto {
    code: string;
}
