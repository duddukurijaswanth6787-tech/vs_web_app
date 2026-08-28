export declare class CreateInvoiceDto {
    orderId: string;
    billingAddress?: Record<string, any>;
    shippingAddress?: Record<string, any>;
    notes?: string;
}
export declare class InvoiceQueryDto {
    orderId?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class InvoiceItemResponse {
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxAmount: number;
    discountAmount: number;
}
export declare class InvoiceResponse {
    id: string;
    orderId: string;
    invoiceNumber: string;
    status: string;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    currency: string;
    billingAddress?: Record<string, any>;
    shippingAddress?: Record<string, any>;
    items?: InvoiceItemResponse[];
    notes?: string;
    createdAt: Date;
}
export declare class InvoiceListResponse {
    data: InvoiceResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
