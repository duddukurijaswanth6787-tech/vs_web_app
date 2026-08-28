import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, InvoiceQueryDto } from './invoice.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class InvoiceController {
    private readonly invoiceService;
    constructor(invoiceService: InvoiceService);
    findAll(query: InvoiceQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./invoice.types").InvoiceResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findByOrderId(orderId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./invoice.types").InvoiceResponse[]>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./invoice.types").InvoiceResponse>>;
    create(dto: CreateInvoiceDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./invoice.types").InvoiceResponse>>;
}
