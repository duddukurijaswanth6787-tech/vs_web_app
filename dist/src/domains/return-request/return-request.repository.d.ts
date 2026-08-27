import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class ReturnRequestRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        status?: string;
        orderId?: string;
        customerId?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            items: ({
                images: {
                    url: string;
                    id: string;
                    displayOrder: number;
                    createdAt: Date;
                    returnItemId: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                quantity: number;
                reason: string | null;
                returnRequestId: string;
                orderItemId: string;
            })[];
        } & {
            id: string;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            createdAt: Date;
            updatedAt: Date;
            orderId: string;
            reason: string;
            adminNotes: string | null;
            returnNumber: string;
            refundPreference: string | null;
        })[];
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
        items: ({
            images: {
                url: string;
                id: string;
                displayOrder: number;
                createdAt: Date;
                returnItemId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            reason: string | null;
            returnRequestId: string;
            orderItemId: string;
        })[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        reason: string;
        adminNotes: string | null;
        returnNumber: string;
        refundPreference: string | null;
    }) | null>;
    create(data: Prisma.ReturnRequestCreateInput): Promise<{
        items: {
            id: string;
            createdAt: Date;
            quantity: number;
            reason: string | null;
            returnRequestId: string;
            orderItemId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        reason: string;
        adminNotes: string | null;
        returnNumber: string;
        refundPreference: string | null;
    }>;
    update(id: string, data: Prisma.ReturnRequestUpdateInput): Promise<{
        items: {
            id: string;
            createdAt: Date;
            quantity: number;
            reason: string | null;
            returnRequestId: string;
            orderItemId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        reason: string;
        adminNotes: string | null;
        returnNumber: string;
        refundPreference: string | null;
    }>;
    generateReturnNumber(): Promise<string>;
}
