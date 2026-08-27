import { PosRepository } from './pos.repository';
import { PosGateway } from './pos.gateway';
import { BarcodeService } from './barcode.service';
import { PrinterService } from './printer.service';
import { OrderWorkflowService } from "../order/order-workflow.service";
import { AuditService } from "../audit/audit.service";
import { ScanBarcodeDto, CreateCheckoutSessionDto, AdoptHandoffTokenDto, CompletePosSaleDto, BarcodeScanResultResponse, CheckoutSessionResponse, GenerateBarcodeImageDto, GenerateBatchStickersDto, PreviewReceiptDto, OpenPosShiftDto, ClosePosShiftDto, CreatePosReturnDto } from './pos.types';
export declare class PosService {
    private readonly repository;
    private readonly gateway;
    private readonly barcodeService;
    private readonly printerService;
    private readonly workflow;
    private readonly auditService;
    private readonly logger;
    constructor(repository: PosRepository, gateway: PosGateway, barcodeService: BarcodeService, printerService: PrinterService, workflow: OrderWorkflowService, auditService: AuditService);
    scanBarcode(dto: ScanBarcodeDto, isOwnerOrManager?: boolean): Promise<BarcodeScanResultResponse>;
    createCheckoutSession(cashierId: string, dto: CreateCheckoutSessionDto): Promise<CheckoutSessionResponse>;
    adoptHandoffSession(dto: AdoptHandoffTokenDto): Promise<CheckoutSessionResponse>;
    completeSale(cashierId: string, dto: CompletePosSaleDto): Promise<{
        success: boolean;
        message: string;
        order: {
            orderId: string;
            orderNumber: string;
            channel: import(".prisma/client").$Enums.OrderChannel;
            paymentMethod: import(".prisma/client").$Enums.PosPaymentMethod | null;
            status: string;
            grandTotal: number;
            itemsCount: number;
            createdAt: Date;
        };
        printReady: boolean;
    }>;
    lookupCustomer(phone: string): Promise<{
        found: boolean;
        userId: string | undefined;
        customerProfileId: string | undefined;
        fullName: string;
        phone: string;
        email: string;
        ordersCount: number;
        totalSpent: number;
        recentOrders: {
            orderId: string;
            orderNumber: string;
            grandTotal: number;
            status: string;
            paymentMethod: import(".prisma/client").$Enums.PosPaymentMethod | null;
            createdAt: Date;
            itemsCount: number;
            items: {
                productName: string;
                quantity: number;
                unitPrice: number;
            }[];
        }[];
    } | {
        found: boolean;
        phone: string;
        message: string;
    }>;
    generateBarcodeImage(dto: GenerateBarcodeImageDto): Promise<Buffer>;
    generateBatchStickers(dto: GenerateBatchStickersDto): Promise<{
        quantity: number;
        barcode: string;
        sku: string;
        html: string;
        tspl: string;
    }>;
    previewReceipt(dto: PreviewReceiptDto): Promise<{
        orderNumber: string;
        html: string;
        escposBase64: string;
    }>;
    lookupSaleForReturn(orderNumber: string): Promise<{
        orderId: string;
        orderNumber: string;
        soldAt: Date;
        paymentMethod: import(".prisma/client").$Enums.PosPaymentMethod | null;
        grandTotal: number;
        customerPhone: string | undefined;
        items: {
            orderItemId: string;
            productName: string;
            variantTitle: string | undefined;
            sku: string;
            quantity: number;
            alreadyReturned: number;
            returnableQuantity: number;
            unitRefund: number;
        }[];
    }>;
    private unitRefundValue;
    createReturn(cashierId: string, dto: CreatePosReturnDto): Promise<{
        success: boolean;
        returnNumber: string;
        refundNumber: string;
        refundMethod: string;
        refundAmount: number;
        orderNumber: string;
        terminalId: string;
        itemsReturned: number;
    }>;
    openShift(cashierId: string, dto: OpenPosShiftDto): Promise<{
        id: string;
        status: string;
        terminalId: string;
        notes: string | null;
        openingCash: import("@prisma/client-runtime-utils").Decimal;
        closingCashCounted: import("@prisma/client-runtime-utils").Decimal | null;
        cashierId: string;
        closingCashExpected: import("@prisma/client-runtime-utils").Decimal | null;
        variance: import("@prisma/client-runtime-utils").Decimal | null;
        openedAt: Date;
        closedAt: Date | null;
    }>;
    getCurrentShift(cashierId: string, terminalId?: string): Promise<{
        id: string;
        status: string;
        terminalId: string;
        notes: string | null;
        openingCash: import("@prisma/client-runtime-utils").Decimal;
        closingCashCounted: import("@prisma/client-runtime-utils").Decimal | null;
        cashierId: string;
        closingCashExpected: import("@prisma/client-runtime-utils").Decimal | null;
        variance: import("@prisma/client-runtime-utils").Decimal | null;
        openedAt: Date;
        closedAt: Date | null;
    } | null>;
    closeShift(shiftId: string, cashierId: string, dto: ClosePosShiftDto): Promise<{
        id: string;
        status: string;
        terminalId: string;
        notes: string | null;
        openingCash: import("@prisma/client-runtime-utils").Decimal;
        closingCashCounted: import("@prisma/client-runtime-utils").Decimal | null;
        cashierId: string;
        closingCashExpected: import("@prisma/client-runtime-utils").Decimal | null;
        variance: import("@prisma/client-runtime-utils").Decimal | null;
        openedAt: Date;
        closedAt: Date | null;
    }>;
    listShifts(params: {
        page?: number;
        limit?: number;
        status?: string;
        terminalId?: string;
        cashierId?: string;
    }): Promise<{
        data: ({
            cashier: {
                id: string;
                firstName: string;
                lastName: string | null;
            };
        } & {
            id: string;
            status: string;
            terminalId: string;
            notes: string | null;
            openingCash: import("@prisma/client-runtime-utils").Decimal;
            closingCashCounted: import("@prisma/client-runtime-utils").Decimal | null;
            cashierId: string;
            closingCashExpected: import("@prisma/client-runtime-utils").Decimal | null;
            variance: import("@prisma/client-runtime-utils").Decimal | null;
            openedAt: Date;
            closedAt: Date | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getShiftReport(shiftId: string): Promise<{
        byMethod: {
            method: import(".prisma/client").$Enums.PosPaymentMethod | null;
            revenue: number;
            count: number;
        }[];
        orderCount: number;
        refundsCount: number;
        refundsAmount: number;
        shift: {
            cashier: {
                id: string;
                firstName: string;
                lastName: string | null;
            };
        } & {
            id: string;
            status: string;
            terminalId: string;
            notes: string | null;
            openingCash: import("@prisma/client-runtime-utils").Decimal;
            closingCashCounted: import("@prisma/client-runtime-utils").Decimal | null;
            cashierId: string;
            closingCashExpected: import("@prisma/client-runtime-utils").Decimal | null;
            variance: import("@prisma/client-runtime-utils").Decimal | null;
            openedAt: Date;
            closedAt: Date | null;
        };
        reportType: string;
        generatedAt: Date;
        windowStart: Date;
        windowEnd: Date;
    }>;
    getPosDaySummary(dateStr?: string): Promise<{
        totalRevenue: number;
        totalOrders: number;
        byMethod: {
            method: import(".prisma/client").$Enums.PosPaymentMethod | null;
            revenue: number;
            count: number;
        }[];
        byTerminal: {
            terminalId: string | null;
            revenue: number;
            orderCount: number;
            refundsCount: number;
            refundsAmount: number;
        }[];
        byCashier: {
            cashierId: string | null;
            cashierName: string;
            revenue: number;
            orderCount: number;
        }[];
        totalRefundsCount: number;
        totalRefundsAmount: number;
    }>;
}
