import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class CancellationRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByOrderId(orderId: string): Promise<{
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        reason: string;
        refundStatus: string;
        adminNotes: string | null;
    } | null>;
    create(data: Prisma.CancellationRequestCreateInput): Promise<{
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        reason: string;
        refundStatus: string;
        adminNotes: string | null;
    }>;
    update(id: string, data: Prisma.CancellationRequestUpdateInput): Promise<{
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        reason: string;
        refundStatus: string;
        adminNotes: string | null;
    }>;
}
