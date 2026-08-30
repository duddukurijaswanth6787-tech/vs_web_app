"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const pos_repository_1 = require("./pos.repository");
const pos_totals_1 = require("./pos-totals");
const pos_tenders_1 = require("./pos-tenders");
const pos_gateway_1 = require("./pos.gateway");
const barcode_service_1 = require("./barcode.service");
const printer_service_1 = require("./printer.service");
const order_workflow_service_1 = require("../order/order-workflow.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const pos_types_1 = require("./pos.types");
let PosService = PosService_1 = class PosService {
    repository;
    gateway;
    barcodeService;
    printerService;
    workflow;
    auditService;
    logger = new common_1.Logger(PosService_1.name);
    constructor(repository, gateway, barcodeService, printerService, workflow, auditService) {
        this.repository = repository;
        this.gateway = gateway;
        this.barcodeService = barcodeService;
        this.printerService = printerService;
        this.workflow = workflow;
        this.auditService = auditService;
    }
    async scanBarcode(dto, isOwnerOrManager = false) {
        const variantMatch = await this.repository.findVariantByBarcode(dto.barcode);
        if (!variantMatch) {
            throw new common_1.NotFoundException(`No product variant found for barcode or SKU "${dto.barcode}"`);
        }
        return this.toScanResult(variantMatch, isOwnerOrManager);
    }
    toScanResult(variantMatch, isOwnerOrManager) {
        const availableStock = variantMatch.inventory
            ? Math.max(0, variantMatch.inventory.availableQuantity -
                (variantMatch.inventory.reservedQuantity ?? 0))
            : 0;
        const price = Number(variantMatch.salePriceOverride ??
            variantMatch.priceOverride ??
            variantMatch.product?.basePrice ??
            0);
        const costPrice = isOwnerOrManager
            ? Number(variantMatch.costPrice ?? variantMatch.product?.costPrice ?? 0)
            : undefined;
        const primaryImage = variantMatch.media && variantMatch.media.length > 0
            ? variantMatch.media[0].url
            : variantMatch.product?.media && variantMatch.product.media.length > 0
                ? variantMatch.product.media[0].url
                : undefined;
        const variantTitle = variantMatch.title ||
            (variantMatch.attributeValues
                ? variantMatch.attributeValues
                    .map((av) => av.option?.label || av.value)
                    .filter((val) => Boolean(val))
                    .join(' / ')
                : undefined);
        return {
            productId: variantMatch.productId,
            productName: variantMatch.product?.name || variantMatch.title || 'Product',
            variantId: variantMatch.id,
            sku: variantMatch.sku,
            barcode: variantMatch.barcode,
            variantTitle,
            price,
            costPrice,
            availableStock,
            primaryImage,
            taxPercent: Number(variantMatch.product?.taxPercentage ?? 0),
            mrp: Number(variantMatch.product?.basePrice ?? price),
            hsnCode: variantMatch.product?.hsnCode ?? undefined,
        };
    }
    async searchProducts(query, isOwnerOrManager = false, limit = 10) {
        const rows = await this.repository.searchVariantsByName(query, limit);
        return rows.map((row) => this.toScanResult(row, isOwnerOrManager));
    }
    async createCheckoutSession(cashierId, dto) {
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Cannot create checkout session with empty cart items');
        }
        const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
        const sessionId = `SHOP-${new Date().getFullYear()}-${randomNum}`;
        const handoffToken = `${randomNum.slice(0, 3)}-${randomNum.slice(3)}`;
        const sessionTaxRates = await this.repository.findProductTaxRates(dto.items.map((i) => i.productId).filter(Boolean));
        const sessionTotals = (0, pos_totals_1.computePosTotals)(dto.items.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            taxPercent: sessionTaxRates.get(item.productId) ?? 0,
        })), dto.discountTotal || 0);
        const subtotal = sessionTotals.subtotal;
        const taxTotal = sessionTotals.taxTotal;
        const grandTotal = sessionTotals.grandTotal;
        const expiresAt = new Date(Date.now() + (dto.hold ? 12 * 60 : 30) * 60 * 1000);
        const session = await this.repository.createCheckoutSession(sessionId, handoffToken, cashierId, dto, subtotal, taxTotal, grandTotal, expiresAt, dto.hold
            ? client_1.CheckoutSessionStatus.DRAFT
            : client_1.CheckoutSessionStatus.WAITING_FOR_WEB);
        const responsePayload = {
            id: session.id,
            sessionId: session.sessionId,
            handoffToken: session.handoffToken,
            status: session.status,
            subtotal: Number(session.subtotal),
            discountTotal: Number(session.discountTotal),
            taxTotal: Number(session.taxTotal),
            grandTotal: Number(session.grandTotal),
            items: dto.items,
            customer: dto.customer,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt,
        };
        return responsePayload;
    }
    async adoptHandoffSession(dto) {
        const session = await this.repository.findCheckoutSessionByToken(dto.handoffToken);
        if (!session) {
            throw new common_1.NotFoundException(`Invalid or expired handoff token: ${dto.handoffToken}`);
        }
        if (session.expiresAt < new Date()) {
            await this.repository.updateCheckoutSessionStatus(session.sessionId, client_1.CheckoutSessionStatus.EXPIRED);
            throw new common_1.BadRequestException('Checkout session has expired. Please re-initiate from mobile.');
        }
        if (session.status !== client_1.CheckoutSessionStatus.WAITING_FOR_WEB &&
            session.status !== client_1.CheckoutSessionStatus.IN_PROGRESS_ON_WEB &&
            session.status !== client_1.CheckoutSessionStatus.DRAFT) {
            throw new common_1.BadRequestException(`Checkout session is already in state: ${session.status}`);
        }
        const updated = await this.repository.updateCheckoutSessionStatus(session.sessionId, client_1.CheckoutSessionStatus.IN_PROGRESS_ON_WEB);
        const sessionPayload = {
            id: updated.id,
            sessionId: updated.sessionId,
            handoffToken: updated.handoffToken,
            status: updated.status,
            subtotal: Number(updated.subtotal),
            discountTotal: Number(updated.discountTotal),
            taxTotal: Number(updated.taxTotal),
            grandTotal: Number(updated.grandTotal),
            items: updated.cart,
            customer: updated.customer || undefined,
            expiresAt: updated.expiresAt,
            createdAt: updated.createdAt,
        };
        this.gateway.emitSessionAdopted(updated.sessionId, sessionPayload);
        return sessionPayload;
    }
    async listHeldSessions(deviceId) {
        const sessions = await this.repository.findHeldSessions(deviceId);
        return sessions.map((session) => ({
            sessionId: session.sessionId,
            handoffToken: session.handoffToken,
            deviceId: session.deviceId,
            customer: session.customer,
            itemsCount: Array.isArray(session.cart) ? session.cart.length : 0,
            grandTotal: Number(session.grandTotal),
            expiresAt: session.expiresAt,
            createdAt: session.createdAt,
        }));
    }
    async cancelHeldSession(sessionId) {
        const session = await this.repository.findCheckoutSessionById(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`No held cart found for ${sessionId}`);
        }
        if (session.status === client_1.CheckoutSessionStatus.COMPLETED) {
            throw new common_1.BadRequestException(`${sessionId} has already been billed and cannot be discarded.`);
        }
        await this.repository.updateCheckoutSessionStatus(sessionId, client_1.CheckoutSessionStatus.CANCELLED);
        return { success: true, sessionId };
    }
    async completeSale(cashierId, dto) {
        if (dto.clientOrderNumber) {
            const existing = await this.repository.findOrderByOrderNumber(dto.clientOrderNumber);
            if (existing) {
                return {
                    success: true,
                    message: 'POS Sale completed successfully',
                    order: {
                        orderId: existing.id,
                        orderNumber: existing.orderNumber,
                        channel: existing.channel,
                        paymentMethod: existing.paymentMethod,
                        status: existing.status,
                        grandTotal: Number(existing.grandTotal),
                        itemsCount: existing.items.length,
                        createdAt: existing.createdAt,
                        changeDue: 0,
                        tenders: undefined,
                    },
                    printReady: true,
                };
            }
        }
        let itemsToProcess = dto.items || [];
        let customerInfo = dto.customer;
        let discountTotal = dto.discountTotal || 0;
        let taxTotal = dto.taxTotal || 0;
        let activeSessionId = null;
        if (dto.sessionId) {
            const session = await this.repository.findCheckoutSessionById(dto.sessionId);
            if (!session) {
                throw new common_1.NotFoundException(`Checkout session ${dto.sessionId} not found`);
            }
            activeSessionId = session.sessionId;
            if (!itemsToProcess || itemsToProcess.length === 0) {
                itemsToProcess = session.cart;
            }
            if (!customerInfo && session.customer) {
                customerInfo =
                    session.customer || undefined;
            }
            discountTotal = discountTotal || Number(session.discountTotal);
            taxTotal = taxTotal || Number(session.taxTotal);
        }
        if (!itemsToProcess || itemsToProcess.length === 0) {
            throw new common_1.BadRequestException('Cannot complete POS sale with an empty cart');
        }
        if (!dto.isOfflineSync) {
            const terminalId = dto.terminalId || pos_types_1.DEFAULT_TERMINAL_ID;
            const openShift = await this.repository.findOpenShiftForTerminal(terminalId);
            if (!openShift) {
                throw new exceptions_1.BusinessException(`No open shift on ${terminalId}. Open a shift before billing so cash sales can be reconciled at close.`, 'POS_SHIFT_REQUIRED');
            }
        }
        if (dto.isOfflineSync) {
            const variantIds = itemsToProcess
                .map((i) => i.variantId)
                .filter((id) => Boolean(id));
            const inventoryMap = await this.repository.findInventoryQuantities(variantIds);
            const shortages = itemsToProcess
                .filter((i) => i.variantId)
                .map((i) => {
                const inv = inventoryMap.get(i.variantId);
                if (!inv || inv.allowBackorder)
                    return null;
                if (inv.availableQuantity < i.quantity) {
                    return {
                        variantId: i.variantId,
                        productName: i.productName,
                        variantTitle: i.variantTitle,
                        requested: i.quantity,
                        available: inv.availableQuantity,
                    };
                }
                return null;
            })
                .filter((s) => s !== null);
            if (shortages.length > 0) {
                throw new exceptions_1.BusinessException('Insufficient stock to sync this offline sale', 'POS_STOCK_CONFLICT', { shortages });
            }
        }
        const customerProfile = await this.repository.findOrCreateWalkInCustomer();
        const taxRates = await this.repository.findProductTaxRates(itemsToProcess.map((i) => i.productId).filter(Boolean));
        const totals = (0, pos_totals_1.computePosTotals)(itemsToProcess.map((i) => ({
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountAmount: i.discountAmount,
            taxPercent: taxRates.get(i.productId) ?? 0,
        })), discountTotal);
        const subtotal = totals.subtotal;
        const calculatedTax = totals.taxTotal;
        const grandTotal = totals.grandTotal;
        discountTotal = totals.discountTotal;
        if (taxTotal && Math.abs(taxTotal - calculatedTax) > 0.01) {
            this.logger.warn(`Till sent tax ${taxTotal} but the products' own rates give ${calculatedTax}; billing the calculated figure.`);
        }
        let tenderAllocations;
        let changeDue = 0;
        if (dto.splitPayments?.length) {
            try {
                const split = (0, pos_tenders_1.allocateTenders)(dto.splitPayments, grandTotal);
                tenderAllocations = split.allocations;
                changeDue = split.changeDue;
            }
            catch (err) {
                throw new common_1.BadRequestException(err instanceof Error ? err.message : 'Invalid split payment');
            }
        }
        const orderNumber = dto.clientOrderNumber || (await this.workflow.generateOrderNumber());
        const order = await this.repository.createPosOrder({
            orderNumber,
            customerId: customerProfile.id,
            cashierId,
            subtotal,
            discountTotal,
            taxTotal: calculatedTax,
            grandTotal,
            paymentMethod: dto.paymentMethod,
            payments: tenderAllocations,
            terminalId: dto.terminalId,
            notes: dto.notes,
            items: itemsToProcess,
            customerInfo,
        });
        try {
            await this.workflow.deductInventory(order.id, cashierId);
        }
        catch (err) {
            await this.workflow.transition(order.id, 'CANCELLED', cashierId, 'Auto-cancelled: insufficient stock at sale completion');
            throw err;
        }
        if (activeSessionId) {
            await this.repository.updateCheckoutSessionStatus(activeSessionId, client_1.CheckoutSessionStatus.COMPLETED, order.id);
        }
        const saleResult = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            channel: order.channel,
            paymentMethod: order.paymentMethod,
            status: order.status,
            grandTotal: Number(order.grandTotal),
            itemsCount: order.items.length,
            createdAt: order.createdAt,
            changeDue,
            tenders: tenderAllocations,
        };
        this.gateway.emitSaleCompleted(activeSessionId, saleResult);
        this.gateway.emitTriggerPrint(dto.terminalId || 'COUNTER_1', {
            orderNumber: order.orderNumber,
            grandTotal: Number(order.grandTotal),
            items: itemsToProcess,
            customer: customerInfo,
            paymentMethod: dto.paymentMethod,
            timestamp: new Date().toISOString(),
        });
        await this.auditService.log({
            action: 'POS_SALE_COMPLETED',
            module: 'pos',
            resource: 'order',
            resourceId: order.id,
            userId: cashierId,
            newValue: {
                orderNumber: order.orderNumber,
                grandTotal: order.grandTotal,
                paymentMethod: dto.paymentMethod,
            },
        });
        return {
            success: true,
            message: 'POS Sale completed successfully',
            order: saleResult,
            printReady: true,
        };
    }
    async lookupCustomer(phone) {
        const result = await this.repository.findCustomerByPhone(phone);
        if (!result) {
            return {
                found: false,
                phone: (phone || '').replace(/\D/g, '').slice(-10),
                message: 'No registered customer found for this phone number',
            };
        }
        return result;
    }
    async generateBarcodeImage(dto) {
        return this.barcodeService.generateBarcodeBuffer(dto.code, dto.bcid || 'code128', dto.scale || 2, dto.height || 10);
    }
    async generateBatchStickers(dto) {
        const html = await this.barcodeService.generateBatchStickersHtml(dto);
        const tspl = this.printerService.buildTsplStickerLabel(dto);
        return {
            quantity: dto.quantity,
            barcode: dto.barcode,
            sku: dto.sku,
            html,
            tspl,
        };
    }
    async previewReceipt(dto) {
        const html = await this.printerService.generateHtmlInvoiceReceipt(dto);
        const escposBuffer = await this.printerService.buildEscPosInvoiceReceipt(dto);
        return {
            orderNumber: dto.orderNumber,
            html,
            escposBase64: escposBuffer.toString('base64'),
        };
    }
    async lookupSaleForReturn(orderNumber) {
        const found = await this.repository.findSaleForReturn(orderNumber.trim());
        if (!found) {
            throw new common_1.NotFoundException(`No sale found for ${orderNumber}`);
        }
        const { order, returnedByItem } = found;
        if (order.channel !== 'POS_SHOPORA') {
            throw new exceptions_1.BusinessException(`${orderNumber} was not sold in store. Online orders are returned through Admin → Returns.`, 'POS_RETURN_NOT_IN_STORE');
        }
        return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            soldAt: order.createdAt,
            paymentMethod: order.paymentMethod,
            grandTotal: Number(order.grandTotal),
            customerPhone: order.customer?.phone ?? undefined,
            items: order.items.map((i) => {
                const returned = returnedByItem.get(i.id) ?? 0;
                return {
                    orderItemId: i.id,
                    productName: i.productName,
                    variantTitle: i.variantTitle ?? undefined,
                    sku: i.sku,
                    quantity: i.quantity,
                    alreadyReturned: returned,
                    returnableQuantity: Math.max(i.quantity - returned, 0),
                    unitRefund: this.unitRefundValue(i),
                };
            }),
        };
    }
    unitRefundValue(item) {
        if (item.quantity <= 0)
            return 0;
        const lineTotal = Number(item.unitPrice) * item.quantity -
            Number(item.discountAmount ?? 0) +
            Number(item.taxAmount ?? 0);
        return Math.max(lineTotal / item.quantity, 0);
    }
    async createReturn(cashierId, dto) {
        const found = await this.repository.findSaleForReturn(dto.orderNumber.trim());
        if (!found) {
            throw new common_1.NotFoundException(`No sale found for ${dto.orderNumber}`);
        }
        const { order, returnedByItem } = found;
        if (order.channel !== 'POS_SHOPORA') {
            throw new exceptions_1.BusinessException(`${dto.orderNumber} was not sold in store. Online orders are returned through Admin → Returns.`, 'POS_RETURN_NOT_IN_STORE');
        }
        const terminalId = dto.terminalId || pos_types_1.DEFAULT_TERMINAL_ID;
        const openShift = await this.repository.findOpenShiftForTerminal(terminalId);
        if (!openShift) {
            throw new exceptions_1.BusinessException(`No open shift on ${terminalId}. Open a shift before refunding so the payout is reconciled at close.`, 'POS_SHIFT_REQUIRED');
        }
        const itemsById = new Map(order.items.map((i) => [i.id, i]));
        const priced = [];
        let refundAmount = 0;
        for (const line of dto.items) {
            const item = itemsById.get(line.orderItemId);
            if (!item) {
                throw new exceptions_1.BusinessException(`Item ${line.orderItemId} is not part of ${order.orderNumber}`, 'POS_RETURN_ITEM_NOT_ON_SALE');
            }
            const returnable = item.quantity - (returnedByItem.get(item.id) ?? 0);
            if (line.quantity > returnable) {
                throw new exceptions_1.BusinessException(`Only ${returnable} of ${item.productName} can still be returned on ${order.orderNumber}`, 'POS_RETURN_QUANTITY_EXCEEDED');
            }
            refundAmount += this.unitRefundValue(item) * line.quantity;
            priced.push({
                orderItemId: item.id,
                variantId: item.variantId,
                quantity: line.quantity,
            });
        }
        if (priced.length === 0) {
            throw new exceptions_1.BusinessException('Select at least one item to return', 'POS_RETURN_EMPTY');
        }
        const payment = order.payments[0];
        if (!payment) {
            throw new exceptions_1.BusinessException(`No payment recorded against ${order.orderNumber}, so there is nothing to refund`, 'POS_RETURN_NO_PAYMENT');
        }
        let refundMethod = dto.refundMethod;
        if (dto.refundMethod === pos_types_1.PosRefundMethodType.ORIGINAL) {
            if (!order.paymentMethod) {
                throw new exceptions_1.BusinessException(`${order.orderNumber} has no recorded payment method. Choose how to refund instead.`, 'POS_RETURN_METHOD_UNKNOWN');
            }
            refundMethod = order.paymentMethod;
        }
        const stamp = Date.now().toString(36).toUpperCase();
        const { returnRequest, refund } = await this.repository.createPosReturn({
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentId: payment.id,
            returnNumber: `RET-${order.orderNumber}-${stamp}`,
            refundNumber: `REF-${order.orderNumber}-${stamp}`,
            reason: dto.reason,
            notes: dto.notes,
            refundMethod,
            refundAmount: Math.round(refundAmount * 100) / 100,
            cashierId,
            items: priced,
            restock: (tx) => this.workflow.restockReturnedItems(tx, {
                orderId: order.id,
                orderNumber: order.orderNumber,
                items: priced,
                userId: cashierId,
                reason: `Returned at ${terminalId} against ${order.orderNumber}`,
            }),
        });
        await this.auditService.log({
            action: 'POS_RETURN_COMPLETED',
            module: 'pos',
            resource: 'return_request',
            resourceId: returnRequest.id,
            userId: cashierId,
            newValue: {
                orderNumber: order.orderNumber,
                terminalId,
                shiftId: openShift.id,
                refundMethod,
                refundAmount: Number(refund.amount),
                items: priced,
            },
        });
        return {
            success: true,
            returnNumber: returnRequest.returnNumber,
            refundNumber: refund.refundNumber,
            refundMethod,
            refundAmount: Number(refund.amount),
            orderNumber: order.orderNumber,
            terminalId,
            itemsReturned: priced.reduce((sum, i) => sum + i.quantity, 0),
        };
    }
    async openShift(cashierId, dto) {
        const existing = await this.repository.findOpenShiftForTerminal(dto.terminalId);
        if (existing) {
            const mine = existing.cashierId === cashierId;
            const who = mine
                ? 'You already have'
                : `${[existing.cashier?.firstName, existing.cashier?.lastName].filter(Boolean).join(' ') || 'Another cashier'} already has`;
            throw new common_1.BadRequestException(`${who} an open shift on ${dto.terminalId} since ${existing.openedAt.toLocaleString()}. Close it before opening a new one.`);
        }
        const shift = await this.repository.createShift({
            terminalId: dto.terminalId,
            cashierId,
            openingCash: dto.openingCash,
            notes: dto.notes,
        });
        await this.auditService.log({
            action: 'POS_SHIFT_OPENED',
            module: 'pos',
            resource: 'pos_shift',
            resourceId: shift.id,
            userId: cashierId,
            newValue: { terminalId: dto.terminalId, openingCash: dto.openingCash },
        });
        return shift;
    }
    async getCurrentShift(cashierId, terminalId) {
        return this.repository.findOpenShift(cashierId, terminalId);
    }
    async recordCashMovement(cashierId, terminalId, dto) {
        const shift = await this.repository.findOpenShiftForTerminal(terminalId || pos_types_1.DEFAULT_TERMINAL_ID);
        if (!shift) {
            throw new common_1.BadRequestException('No shift is open at this terminal, so there is no drawer to move cash in or out of.');
        }
        const amount = Math.round((Number(dto.amount) || 0) * 100) / 100;
        if (amount <= 0) {
            throw new common_1.BadRequestException('Cash movement amount must be positive.');
        }
        const movement = await this.repository.createCashMovement({
            shiftId: shift.id,
            terminalId: shift.terminalId,
            cashierId,
            direction: dto.direction,
            amount,
            reason: dto.reason.trim(),
        });
        await this.auditService.log({
            action: 'POS_CASH_MOVEMENT',
            module: 'pos',
            resource: 'pos_shift',
            resourceId: shift.id,
            userId: cashierId,
            newValue: {
                direction: dto.direction,
                amount,
                reason: dto.reason,
                terminalId: shift.terminalId,
            },
        });
        const totals = await this.repository.sumCashMovementsForShift(shift.id);
        return {
            id: movement.id,
            shiftId: shift.id,
            direction: movement.direction,
            amount: Number(movement.amount),
            reason: movement.reason,
            createdAt: movement.createdAt,
            shiftTotals: totals,
        };
    }
    async listCashMovements(shiftId) {
        const movements = await this.repository.findCashMovementsForShift(shiftId);
        const totals = await this.repository.sumCashMovementsForShift(shiftId);
        return {
            movements: movements.map((m) => ({
                id: m.id,
                direction: m.direction,
                amount: Number(m.amount),
                reason: m.reason,
                createdAt: m.createdAt,
            })),
            ...totals,
        };
    }
    async closeShift(shiftId, cashierId, dto) {
        const shift = await this.repository.findShiftById(shiftId);
        if (!shift)
            throw new common_1.NotFoundException('Shift not found');
        if (shift.status !== 'OPEN') {
            throw new common_1.BadRequestException('This shift is already closed');
        }
        const { cashSales, cashRefunds } = await this.repository.getCashMovementForWindow(shift.terminalId, shift.openedAt, new Date());
        const { cashIn, cashOut } = await this.repository.sumCashMovementsForShift(shift.id);
        const closingCashExpected = Number(shift.openingCash) + cashSales - cashRefunds + cashIn - cashOut;
        const variance = dto.closingCashCounted - closingCashExpected;
        const closed = await this.repository.closeShift(shiftId, {
            closingCashExpected,
            closingCashCounted: dto.closingCashCounted,
            variance,
            notes: dto.notes,
        });
        await this.auditService.log({
            action: 'POS_SHIFT_CLOSED',
            module: 'pos',
            resource: 'pos_shift',
            resourceId: shiftId,
            userId: cashierId,
            newValue: {
                closingCashExpected,
                closingCashCounted: dto.closingCashCounted,
                variance,
            },
        });
        return closed;
    }
    async listShifts(params) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const { data, total } = await this.repository.listShifts({
            page,
            limit,
            status: params.status,
            terminalId: params.terminalId,
            cashierId: params.cashierId,
        });
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrevious: page > 1,
            },
        };
    }
    async getShiftReport(shiftId) {
        const shift = await this.repository.findShiftById(shiftId);
        if (!shift)
            throw new common_1.NotFoundException('Shift not found');
        const windowEnd = shift.closedAt || new Date();
        const [breakdown, cashMovements, cashFromSales] = await Promise.all([
            this.repository.getShiftSalesBreakdown(shift.terminalId, shift.openedAt, windowEnd),
            this.repository.sumCashMovementsForShift(shift.id),
            this.repository.getCashMovementForWindow(shift.terminalId, shift.openedAt, windowEnd),
        ]);
        const expectedCash = Number(shift.openingCash) +
            cashFromSales.cashSales -
            cashFromSales.cashRefunds +
            cashMovements.cashIn -
            cashMovements.cashOut;
        return {
            shift,
            reportType: shift.status === 'OPEN' ? 'X_REPORT' : 'Z_REPORT',
            generatedAt: new Date(),
            windowStart: shift.openedAt,
            windowEnd,
            openingCash: Number(shift.openingCash),
            cashSales: cashFromSales.cashSales,
            cashRefunds: cashFromSales.cashRefunds,
            cashIn: cashMovements.cashIn,
            cashOut: cashMovements.cashOut,
            expectedCash: Math.round(expectedCash * 100) / 100,
            ...breakdown,
        };
    }
    async getPosDaySummary(dateStr) {
        const date = dateStr ? new Date(dateStr) : new Date();
        const from = new Date(date);
        from.setHours(0, 0, 0, 0);
        const to = new Date(date);
        to.setHours(23, 59, 59, 999);
        return this.repository.getPosDaySummary(from, to);
    }
};
exports.PosService = PosService;
exports.PosService = PosService = PosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pos_repository_1.PosRepository,
        pos_gateway_1.PosGateway,
        barcode_service_1.BarcodeService,
        printer_service_1.PrinterService,
        order_workflow_service_1.OrderWorkflowService,
        audit_service_1.AuditService])
], PosService);
//# sourceMappingURL=pos.service.js.map