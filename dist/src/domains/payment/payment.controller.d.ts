import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentQueryDto, VerifyPaymentDto, UpdateRazorpayConfigDto } from './payment.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    findAll(query: PaymentQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./payment.types").PaymentResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getConfig(): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./payment.types").RazorpayConfigResponse>>;
    updateConfig(dto: UpdateRazorpayConfigDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./payment.types").RazorpayConfigResponse>>;
    findByOrderId(orderId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./payment.types").PaymentResponse[]>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./payment.types").PaymentResponse>>;
    create(dto: CreatePaymentDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./payment.types").PaymentResponse>>;
    updateStatus(id: string, body: {
        status: string;
    }, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./payment.types").PaymentResponse>>;
    verifyPayment(id: string, dto: VerifyPaymentDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./payment.types").PaymentResponse>>;
    handleWebhook(body: any, signature: string, req: any): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        status: string;
        reason: string;
        event?: undefined;
    } | {
        status: string;
        reason?: undefined;
        event?: undefined;
    } | {
        status: string;
        event: any;
        reason?: undefined;
    }>>;
}
