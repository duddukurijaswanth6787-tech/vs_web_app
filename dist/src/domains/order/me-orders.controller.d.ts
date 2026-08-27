import { OrderService } from './order.service';
import { OrderQueryDto } from './order.types';
import { CancellationService } from "../cancellation/cancellation.service";
import { InvoiceService } from "../invoice/invoice.service";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma.service";
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class MeOrdersController {
    private readonly orderService;
    private readonly cancellationService;
    private readonly invoiceService;
    private readonly prisma;
    private readonly auditService;
    constructor(orderService: OrderService, cancellationService: CancellationService, invoiceService: InvoiceService, prisma: PrismaService, auditService: AuditService);
    private resolveCustomerId;
    findAll(query: OrderQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: never[];
        meta: {};
    }> | import("@common/responses/response.builder").ResponsePayload<{
        data: import("./order.types").OrderResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findByOrderNumber(orderNumber: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null> | import("@common/responses/response.builder").ResponsePayload<import("./order.types").OrderResponse>>;
    tracking(orderNumber: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null> | import("@common/responses/response.builder").ResponsePayload<{
        orderNumber: string;
        status: string;
        carrier: null;
        trackingNumber: null;
        trackingUrl: string;
        estimatedDelivery: string;
        currentStatus: string;
        timeline: {
            status: any;
            time: string;
        }[];
    }>>;
    invoice(orderNumber: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null> | import("@common/responses/response.builder").ResponsePayload<{
        downloadUrl: null;
        fileName: null;
        mimeType: null;
        invoice: import("../invoice").InvoiceResponse;
    }> | import("@common/responses/response.builder").ResponsePayload<{
        downloadUrl: null;
        fileName: null;
        mimeType: null;
        invoice: {
            invoiceNumber: string;
            invoiceDate: string;
            orderNumber: string;
            customer: {
                name: string;
                email: string;
                phone: string;
            };
            billingAddress: {
                fullName: string;
                phone: string;
                addressLine1: string;
                addressLine2: string;
                city: string;
                state: string;
                country: string;
                postalCode: string;
            } | null;
            shippingAddress: {
                fullName: string;
                phone: string;
                addressLine1: string;
                addressLine2: string;
                city: string;
                state: string;
                country: string;
                postalCode: string;
            } | null;
            items: {
                productName: any;
                sku: any;
                quantity: any;
                unitPrice: any;
                totalPrice: any;
                taxAmount: any;
                discountAmount: any;
            }[];
            subtotal: number;
            tax: number;
            shipping: number;
            discount: number;
            wallet: number;
            total: number;
            paymentMethod: string;
            paymentStatus: string;
            currency: string;
        };
    }>>;
    cancel(orderNumber: string, body: {
        reason: string;
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null> | import("@common/responses/response.builder").ResponsePayload<import("../cancellation").CancellationResponse>>;
}
