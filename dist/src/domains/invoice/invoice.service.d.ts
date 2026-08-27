import { AuditService } from "../audit/audit.service";
import { InvoiceRepository } from './invoice.repository';
import { CreateInvoiceDto, InvoiceQueryDto, InvoiceResponse } from './invoice.types';
import { PrismaService } from "../../database/prisma.service";
export declare class InvoiceService {
    private readonly invoiceRepository;
    private readonly auditService;
    private readonly prisma;
    constructor(invoiceRepository: InvoiceRepository, auditService: AuditService, prisma: PrismaService);
    private toItemResponse;
    private toResponse;
    findAll(query: InvoiceQueryDto): Promise<{
        data: InvoiceResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<InvoiceResponse>;
    findByOrderId(orderId: string): Promise<InvoiceResponse[]>;
    create(userId: string, dto: CreateInvoiceDto): Promise<InvoiceResponse>;
}
