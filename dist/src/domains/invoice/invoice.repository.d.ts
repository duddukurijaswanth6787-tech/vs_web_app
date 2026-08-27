import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class InvoiceRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        orderId?: string;
        status?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            subtotal: Prisma.Decimal;
            discountTotal: Prisma.Decimal;
            taxTotal: Prisma.Decimal;
            grandTotal: Prisma.Decimal;
            notes: string | null;
            orderId: string;
            invoiceNumber: string;
            billingAddress: Prisma.JsonValue | null;
            shippingAddress: Prisma.JsonValue | null;
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
    findById(id: string): Promise<({
        items: {
            id: string;
            createdAt: Date;
            sku: string;
            productName: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            invoiceId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        subtotal: Prisma.Decimal;
        discountTotal: Prisma.Decimal;
        taxTotal: Prisma.Decimal;
        grandTotal: Prisma.Decimal;
        notes: string | null;
        orderId: string;
        invoiceNumber: string;
        billingAddress: Prisma.JsonValue | null;
        shippingAddress: Prisma.JsonValue | null;
    }) | null>;
    findByOrderId(orderId: string): Promise<({
        items: {
            id: string;
            createdAt: Date;
            sku: string;
            productName: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            invoiceId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        subtotal: Prisma.Decimal;
        discountTotal: Prisma.Decimal;
        taxTotal: Prisma.Decimal;
        grandTotal: Prisma.Decimal;
        notes: string | null;
        orderId: string;
        invoiceNumber: string;
        billingAddress: Prisma.JsonValue | null;
        shippingAddress: Prisma.JsonValue | null;
    })[]>;
    create(data: Prisma.InvoiceCreateInput): Promise<{
        items: {
            id: string;
            createdAt: Date;
            sku: string;
            productName: string;
            quantity: number;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            invoiceId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        subtotal: Prisma.Decimal;
        discountTotal: Prisma.Decimal;
        taxTotal: Prisma.Decimal;
        grandTotal: Prisma.Decimal;
        notes: string | null;
        orderId: string;
        invoiceNumber: string;
        billingAddress: Prisma.JsonValue | null;
        shippingAddress: Prisma.JsonValue | null;
    }>;
    update(id: string, data: Prisma.InvoiceUpdateInput): Promise<{
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        subtotal: Prisma.Decimal;
        discountTotal: Prisma.Decimal;
        taxTotal: Prisma.Decimal;
        grandTotal: Prisma.Decimal;
        notes: string | null;
        orderId: string;
        invoiceNumber: string;
        billingAddress: Prisma.JsonValue | null;
        shippingAddress: Prisma.JsonValue | null;
    }>;
    generateInvoiceNumber(): Promise<string>;
}
