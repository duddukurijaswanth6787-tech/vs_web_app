import { AuditService } from "../audit/audit.service";
import { OrderWorkflowService } from "../order/order-workflow.service";
import { CancellationRepository } from './cancellation.repository';
import { CreateCancellationDto, UpdateCancellationDto, CancellationResponse } from './cancellation.types';
import { PrismaService } from "../../database/prisma.service";
export declare class CancellationService {
    private readonly cancelRepo;
    private readonly auditService;
    private readonly prisma;
    private readonly workflow;
    constructor(cancelRepo: CancellationRepository, auditService: AuditService, prisma: PrismaService, workflow: OrderWorkflowService);
    private toResponse;
    findByOrderId(orderId: string): Promise<CancellationResponse>;
    create(userId: string, dto: CreateCancellationDto): Promise<CancellationResponse>;
    update(id: string, dto: UpdateCancellationDto, userId: string): Promise<CancellationResponse>;
}
