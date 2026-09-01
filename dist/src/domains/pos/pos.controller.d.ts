import type { JwtPayload } from "../auth/services/jwt.service";
import { PosService } from './pos.service';
import { ScanBarcodeDto, CreateCheckoutSessionDto, AdoptHandoffTokenDto, CompletePosSaleDto, BarcodeScanResultResponse, CheckoutSessionResponse, GenerateBarcodeImageDto, GenerateBatchStickersDto, PreviewReceiptDto, OpenPosShiftDto, CreatePosReturnDto, ClosePosShiftDto, PosCashMovementDto } from './pos.types';
import type { Response } from 'express';
export declare class PosController {
    private readonly posService;
    constructor(posService: PosService);
    scanBarcode(user: JwtPayload, dto: ScanBarcodeDto): Promise<BarcodeScanResultResponse>;
    searchProducts(user: JwtPayload, q?: string, limit?: string): Promise<BarcodeScanResultResponse[]>;
    createCheckoutSession(user: JwtPayload, dto: CreateCheckoutSessionDto): Promise<CheckoutSessionResponse>;
    listHeldSessions(terminalId?: string): Promise<{
        sessionId: string;
        handoffToken: string;
        deviceId: string | null;
        customer: import("./pos.types").PosCustomerInfoDto | undefined;
        itemsCount: number;
        grandTotal: number;
        expiresAt: Date;
        createdAt: Date;
    }[]>;
    cancelHeldSession(sessionId: string): Promise<{
        success: boolean;
        sessionId: string;
    }>;
    adoptHandoffSession(dto: AdoptHandoffTokenDto): Promise<CheckoutSessionResponse>;
    completeSale(user: JwtPayload, dto: CompletePosSaleDto): Promise<{
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
            changeDue: number;
            tenders: {
                method: string;
                amount: number;
            }[] | undefined;
        };
        printReady: boolean;
    }>;
    generateBarcodeImage(query: GenerateBarcodeImageDto, res: Response): Promise<void>;
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
    createReturn(user: JwtPayload, dto: CreatePosReturnDto): Promise<{
        success: boolean;
        returnNumber: string;
        refundNumber: string;
        refundMethod: string;
        refundAmount: number;
        orderNumber: string;
        terminalId: string;
        itemsReturned: number;
    }>;
    openShift(user: JwtPayload, dto: OpenPosShiftDto): Promise<{
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
    getCurrentShift(user: JwtPayload, terminalId?: string): Promise<{
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
    closeShift(user: JwtPayload, id: string, dto: ClosePosShiftDto): Promise<{
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
    listShifts(page?: string, limit?: string, status?: string, terminalId?: string, cashierId?: string): Promise<{
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
    recordCashMovement(user: JwtPayload, dto: PosCashMovementDto, terminalId?: string): Promise<{
        id: string;
        shiftId: string;
        direction: string;
        amount: number;
        reason: string;
        createdAt: Date;
        shiftTotals: {
            cashIn: number;
            cashOut: number;
            net: number;
        };
    }>;
    listCashMovements(id: string): Promise<{
        cashIn: number;
        cashOut: number;
        net: number;
        movements: {
            id: string;
            direction: string;
            amount: number;
            reason: string;
            createdAt: Date;
        }[];
    }>;
    getShiftReport(id: string): Promise<{
        byMethod: {
            method: string;
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
        openingCash: number;
        cashSales: number;
        cashRefunds: number;
        cashIn: number;
        cashOut: number;
        expectedCash: number;
    }>;
    getPosAnalyticsSummary(date?: string): Promise<{
        totalRevenue: number;
        totalOrders: number;
        byMethod: {
            method: string;
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
