export declare const CHECKOUT_PAYMENT_METHODS: readonly ["COD", "RAZORPAY"];
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];
export declare class CheckoutPreviewDto {
    addressId: string;
    shippingMethod?: string;
    couponCode?: string;
}
export declare class CheckoutItemResponse {
    productId: string;
    productName: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxAmount: number;
}
export declare class CheckoutSummaryResponse {
    items: CheckoutItemResponse[];
    itemCount: number;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    shippingCharge: number;
    grandTotal: number;
    estimatedDelivery: string;
}
export declare class PlaceOrderDto {
    addressId: string;
    shippingMethod?: string;
    notes?: string;
    deliveryInstructions?: string;
    preferredDeliverySlot?: string;
    terminalId?: string;
    couponCode?: string;
    isGift?: boolean;
    giftWrapMessage?: string;
    paymentMethod?: CheckoutPaymentMethod;
}
export declare class PlaceOrderPaymentResponse {
    paymentId: string;
    providerOrderId: string;
    amount: number;
    currency: string;
    razorpayKeyId: string;
}
