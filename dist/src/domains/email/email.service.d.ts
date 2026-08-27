import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { SendEmailDto } from './email.types';
export declare class EmailService {
    private readonly prisma;
    private readonly configService;
    private readonly auditService;
    private readonly logger;
    private transporter;
    constructor(prisma: PrismaService, configService: ConfigService, auditService: AuditService);
    private isEnabled;
    private getTransporter;
    private fromHeader;
    send(dto: SendEmailDto, actorId?: string): Promise<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        template: string;
        subject: string;
        toEmail: string;
        providerRef: string | null;
    }>;
    private layout;
    sendPasswordResetEmail(to: string, resetUrl: string, userId?: string): Promise<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        template: string;
        subject: string;
        toEmail: string;
        providerRef: string | null;
    }>;
    sendWelcomeEmail(to: string, firstName: string | undefined, userId?: string): Promise<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        template: string;
        subject: string;
        toEmail: string;
        providerRef: string | null;
    }>;
    sendOrderConfirmationEmail(params: {
        to: string;
        userId?: string;
        orderNumber: string;
        items: {
            productName: string;
            variantTitle?: string;
            quantity: number;
            unitPrice: number;
        }[];
        subtotal: number;
        discountTotal?: number;
        taxTotal?: number;
        shippingCharge?: number;
        grandTotal: number;
    }): Promise<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        template: string;
        subject: string;
        toEmail: string;
        providerRef: string | null;
    }>;
    listLogs(page?: number, limit?: number): Promise<{
        data: {
            error: string | null;
            id: string;
            status: string;
            createdAt: Date;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string | null;
            template: string;
            subject: string;
            toEmail: string;
            providerRef: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
