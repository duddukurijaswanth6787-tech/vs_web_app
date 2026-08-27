import { ConfigService } from '@nestjs/config';
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma.service";
import { OrderWorkflowService } from "../order/order-workflow.service";
import { AppSettingRepository } from "../app-setting/app-setting.repository";
import { PaymentRepository } from './payment.repository';
import { CreatePaymentDto, PaymentQueryDto, PaymentResponse, RazorpayConfigResponse, UpdateRazorpayConfigDto } from './payment.types';
export declare class PaymentService {
    private readonly paymentRepository;
    private readonly auditService;
    private readonly orderWorkflowService;
    private readonly configService;
    private readonly prisma;
    private readonly settingRepository;
    constructor(paymentRepository: PaymentRepository, auditService: AuditService, orderWorkflowService: OrderWorkflowService, configService: ConfigService, prisma: PrismaService, settingRepository: AppSettingRepository);
    private getEffectiveKeyId;
    private getEffectiveKeySecret;
    private getEffectiveWebhookSecret;
    getConfig(): Promise<RazorpayConfigResponse>;
    updateConfig(dto: UpdateRazorpayConfigDto, userId: string): Promise<RazorpayConfigResponse>;
    private isRazorpayEnabled;
    private getRazorpayClient;
    private toResponse;
    findAll(query: PaymentQueryDto): Promise<{
        data: PaymentResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<PaymentResponse>;
    findByOrderId(orderId: string): Promise<PaymentResponse[]>;
    create(userId: string, dto: CreatePaymentDto): Promise<PaymentResponse>;
    verifyPayment(id: string, razorpayPaymentId: string, razorpaySignature: string, userId: string): Promise<PaymentResponse>;
    refundPayment(paymentId: string, amount: number): Promise<{
        razorpayRefundId: string;
        status: 'pending' | 'processed' | 'failed';
    }>;
    handleWebhook(rawBody: string, signature: string): Promise<{
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
    }>;
    updateStatus(id: string, status: string, userId: string): Promise<PaymentResponse>;
}
