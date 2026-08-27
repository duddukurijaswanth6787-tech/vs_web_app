import { RefundService } from './refund.service';
import { CreateRefundDto, UpdateRefundDto, RefundQueryDto } from './refund.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class RefundController {
    private readonly refundService;
    constructor(refundService: RefundService);
    findAll(query: RefundQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./refund.types").RefundResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findByOrderId(orderId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./refund.types").RefundResponse[]>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./refund.types").RefundResponse>>;
    create(dto: CreateRefundDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./refund.types").RefundResponse>>;
    updateStatus(id: string, dto: UpdateRefundDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./refund.types").RefundResponse>>;
}
