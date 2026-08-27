import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class PaymentRepository {
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
            metadata: Prisma.JsonValue | null;
            method: string;
            provider: string;
            orderId: string;
            paymentNumber: string;
            amount: Prisma.Decimal;
            transactionId: string | null;
            providerOrderId: string | null;
            providerPaymentId: string | null;
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
        transactions: {
            id: string;
            status: string;
            createdAt: Date;
            type: string;
            metadata: Prisma.JsonValue | null;
            amount: Prisma.Decimal;
            providerRefId: string | null;
            paymentId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: Prisma.JsonValue | null;
        method: string;
        provider: string;
        orderId: string;
        paymentNumber: string;
        amount: Prisma.Decimal;
        transactionId: string | null;
        providerOrderId: string | null;
        providerPaymentId: string | null;
    }) | null>;
    findByOrderId(orderId: string): Promise<({
        transactions: {
            id: string;
            status: string;
            createdAt: Date;
            type: string;
            metadata: Prisma.JsonValue | null;
            amount: Prisma.Decimal;
            providerRefId: string | null;
            paymentId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: Prisma.JsonValue | null;
        method: string;
        provider: string;
        orderId: string;
        paymentNumber: string;
        amount: Prisma.Decimal;
        transactionId: string | null;
        providerOrderId: string | null;
        providerPaymentId: string | null;
    })[]>;
    create(data: Prisma.PaymentCreateInput): Promise<{
        transactions: {
            id: string;
            status: string;
            createdAt: Date;
            type: string;
            metadata: Prisma.JsonValue | null;
            amount: Prisma.Decimal;
            providerRefId: string | null;
            paymentId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: Prisma.JsonValue | null;
        method: string;
        provider: string;
        orderId: string;
        paymentNumber: string;
        amount: Prisma.Decimal;
        transactionId: string | null;
        providerOrderId: string | null;
        providerPaymentId: string | null;
    }>;
    update(id: string, data: Prisma.PaymentUpdateInput): Promise<{
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        metadata: Prisma.JsonValue | null;
        method: string;
        provider: string;
        orderId: string;
        paymentNumber: string;
        amount: Prisma.Decimal;
        transactionId: string | null;
        providerOrderId: string | null;
        providerPaymentId: string | null;
    }>;
    markCapturedIfNotAlready(id: string, data: Prisma.PaymentUpdateManyMutationInput): Promise<number>;
    createTransaction(data: Prisma.PaymentTransactionCreateInput): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        type: string;
        metadata: Prisma.JsonValue | null;
        amount: Prisma.Decimal;
        providerRefId: string | null;
        paymentId: string;
    }>;
    generatePaymentNumber(): Promise<string>;
}
