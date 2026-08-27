export declare class OrderQueryDto {
    search?: string;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class OrderItemResponse {
    id: string;
    productId: string;
    productName: string;
    variantId?: string;
    variantTitle?: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxAmount: number;
    discountAmount: number;
}
export declare class OrderAddressResponse {
    id: string;
    addressType: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    landmark?: string;
}
export declare class OrderTimelineResponse {
    id: string;
    status: string;
    message?: string;
    createdBy?: string;
    createdAt: Date;
}
export declare class OrderResponse {
    id: string;
    orderNumber: string;
    customerId: string;
    status: string;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    shippingCharge: number;
    grandTotal: number;
    currency: string;
    notes?: string;
    channel?: string;
    paymentMethod?: string;
    terminalId?: string;
    items?: OrderItemResponse[];
    addresses?: OrderAddressResponse[];
    timeline?: OrderTimelineResponse[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class OrderListResponse {
    data: OrderResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
