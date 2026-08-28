import { ReturnRequestService } from './return-request.service';
import { ReturnQueryDto } from './return-request.types';
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../../database/prisma.service";
import type { JwtPayload } from "../auth/services/jwt.service";
declare class CustomerReturnItemDto {
    orderItemId: string;
    quantity: number;
    reason?: string;
}
declare class CustomerCreateReturnDto {
    orderId: string;
    reason: string;
    description?: string;
    refundPreference?: string;
    images?: string[];
    items: CustomerReturnItemDto[];
}
export declare class MeReturnsController {
    private readonly returnRequestService;
    private readonly prisma;
    private readonly auditService;
    private readonly notificationService;
    constructor(returnRequestService: ReturnRequestService, prisma: PrismaService, auditService: AuditService, notificationService: NotificationService);
    private resolveCustomerId;
    create(dto: CustomerCreateReturnDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./return-request.types").ReturnRequestResponse>>;
    findAll(query: ReturnQueryDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: {
            id: string;
            returnNumber: string;
            orderNumber: string;
            status: string;
            reason: string;
            items: {
                id: any;
                orderItemId: any;
                quantity: any;
                reason: any;
            }[];
            createdAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(returnId: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null> | import("../../common/responses/response.builder").ResponsePayload<{
        id: string;
        returnNumber: string;
        status: string;
        reason: string;
        refundPreference: string | undefined;
        adminNotes: string | undefined;
        items: {
            id: any;
            orderItemId: any;
            quantity: any;
            reason: any;
            images: any;
        }[];
        order: {
            orderNumber: string;
            status: string;
            timeline: {
                status: any;
                time: any;
            }[];
        };
        createdAt: Date;
    }>>;
    cancel(returnId: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null> | import("../../common/responses/response.builder").ResponsePayload<{
        id: string;
        status: string;
    }>>;
}
export {};
