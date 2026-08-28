import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notification/notification.service";
import { OrderWorkflowService } from "../order/order-workflow.service";
import { ReturnRequestRepository } from './return-request.repository';
import { CreateReturnDto, UpdateReturnStatusDto, ReturnQueryDto, ReturnRequestResponse } from './return-request.types';
import { PrismaService } from "../../database/prisma.service";
export declare class ReturnRequestService {
    private readonly returnRepo;
    private readonly auditService;
    private readonly notificationService;
    private readonly prisma;
    private readonly workflow;
    constructor(returnRepo: ReturnRequestRepository, auditService: AuditService, notificationService: NotificationService, prisma: PrismaService, workflow: OrderWorkflowService);
    private getSetting;
    private toResponse;
    findAll(query: ReturnQueryDto, customerId?: string): Promise<{
        data: ReturnRequestResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<ReturnRequestResponse>;
    create(userId: string, dto: CreateReturnDto): Promise<ReturnRequestResponse>;
    updateStatus(id: string, dto: UpdateReturnStatusDto, userId: string): Promise<ReturnRequestResponse>;
}
