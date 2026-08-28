export declare class SendSmsDto {
    phone: string;
    template: string;
    message: string;
    userId?: string;
}
export declare class SendOrderSmsDto {
    orderId: string;
    template?: string;
}
