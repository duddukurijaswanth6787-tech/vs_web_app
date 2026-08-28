import { AuditService } from "../audit/audit.service";
import { PaymentService } from "../payment/payment.service";
import { RefundRepository } from './refund.repository';
import { CreateRefundDto, UpdateRefundDto, RefundQueryDto, RefundResponse } from './refund.types';
export declare class RefundService {
    private readonly refundRepository;
    private readonly auditService;
    private readonly paymentService;
    constructor(refundRepository: RefundRepository, auditService: AuditService, paymentService: PaymentService);
    private toResponse;
    findAll(query: RefundQueryDto): Promise<{
        data: RefundResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<RefundResponse>;
    findByOrderId(orderId: string): Promise<RefundResponse[]>;
    create(userId: string, dto: CreateRefundDto): Promise<RefundResponse>;
    updateStatus(id: string, dto: UpdateRefundDto, userId: string): Promise<RefundResponse>;
}
