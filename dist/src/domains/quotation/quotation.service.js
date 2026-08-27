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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const pos_service_1 = require("../pos/pos.service");
const quotation_math_1 = require("./quotation.math");
const EDITABLE = ['DRAFT', 'SENT'];
let QuotationService = class QuotationService {
    prisma;
    posService;
    constructor(prisma, posService) {
        this.prisma = prisma;
        this.posService = posService;
    }
    lineInputs(items) {
        return items.map((i) => ({
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discountPercent: i.discountPercent,
            taxPercent: i.taxPercent,
        }));
    }
    async create(userId, dto) {
        if (!dto.items?.length) {
            throw new exceptions_1.BusinessException('A quotation needs at least one product line', 'QUOTATION_EMPTY');
        }
        const totals = (0, quotation_math_1.computeQuotation)(this.lineInputs(dto.items));
        return this.prisma.quotation.create({
            data: {
                quotationNumber: (0, quotation_math_1.buildQuotationNumber)(),
                customerId: dto.customerId,
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                customerEmail: dto.customerEmail,
                status: dto.status ?? 'DRAFT',
                subtotal: totals.subtotal,
                discountTotal: totals.discountTotal,
                taxTotal: totals.taxTotal,
                grandTotal: totals.grandTotal,
                notes: dto.notes,
                termsText: dto.termsText,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                createdBy: userId,
                items: {
                    create: dto.items.map((item, idx) => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        productName: item.productName,
                        variantTitle: item.variantTitle,
                        sku: item.sku ?? '',
                        quantity: totals.lines[idx].quantity,
                        unitPrice: totals.lines[idx].unitPrice,
                        discountPercent: totals.lines[idx].discountPercent,
                        discountAmount: totals.lines[idx].discountAmount,
                        taxPercent: totals.lines[idx].taxPercent,
                        taxAmount: totals.lines[idx].taxAmount,
                        totalPrice: totals.lines[idx].totalPrice,
                    })),
                },
            },
            include: { items: true },
        });
    }
    async list(params) {
        const page = Math.max(1, params.page ?? 1);
        const limit = Math.min(100, Math.max(1, params.limit ?? 20));
        const where = { deletedAt: null };
        if (params.status)
            where.status = params.status;
        if (params.search) {
            where.OR = [
                { quotationNumber: { contains: params.search, mode: 'insensitive' } },
                { customerName: { contains: params.search, mode: 'insensitive' } },
                { customerPhone: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const [rows, total] = await Promise.all([
            this.prisma.quotation.findMany({
                where,
                include: { items: true },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.quotation.count({ where }),
        ]);
        return {
            data: rows,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
            },
        };
    }
    async get(id) {
        const quotation = await this.prisma.quotation.findFirst({
            where: { id, deletedAt: null },
            include: { items: true },
        });
        if (!quotation) {
            throw new exceptions_1.BusinessException('Quotation not found', 'QUOTATION_NOT_FOUND');
        }
        return quotation;
    }
    async update(userId, id, dto) {
        const existing = await this.get(id);
        if (!EDITABLE.includes(existing.status)) {
            throw new exceptions_1.BusinessException(`A ${existing.status.toLowerCase()} quotation can no longer be edited`, 'QUOTATION_LOCKED');
        }
        const items = dto.items ?? [];
        const totals = (0, quotation_math_1.computeQuotation)(this.lineInputs(items));
        return this.prisma.$transaction(async (tx) => {
            if (dto.items) {
                await tx.quotationItem.deleteMany({ where: { quotationId: id } });
            }
            return tx.quotation.update({
                where: { id },
                data: {
                    customerId: dto.customerId ?? existing.customerId,
                    customerName: dto.customerName ?? existing.customerName,
                    customerPhone: dto.customerPhone ?? existing.customerPhone,
                    customerEmail: dto.customerEmail ?? existing.customerEmail,
                    status: dto.status ?? existing.status,
                    notes: dto.notes ?? existing.notes,
                    termsText: dto.termsText ?? existing.termsText,
                    validUntil: dto.validUntil
                        ? new Date(dto.validUntil)
                        : existing.validUntil,
                    updatedBy: userId,
                    ...(dto.items && {
                        subtotal: totals.subtotal,
                        discountTotal: totals.discountTotal,
                        taxTotal: totals.taxTotal,
                        grandTotal: totals.grandTotal,
                        items: {
                            create: items.map((item, idx) => ({
                                productId: item.productId,
                                variantId: item.variantId,
                                productName: item.productName,
                                variantTitle: item.variantTitle,
                                sku: item.sku ?? '',
                                quantity: totals.lines[idx].quantity,
                                unitPrice: totals.lines[idx].unitPrice,
                                discountPercent: totals.lines[idx].discountPercent,
                                discountAmount: totals.lines[idx].discountAmount,
                                taxPercent: totals.lines[idx].taxPercent,
                                taxAmount: totals.lines[idx].taxAmount,
                                totalPrice: totals.lines[idx].totalPrice,
                            })),
                        },
                    }),
                },
                include: { items: true },
            });
        });
    }
    async cancel(userId, id) {
        const existing = await this.get(id);
        if (existing.status === 'CONVERTED') {
            throw new exceptions_1.BusinessException('This quotation has already been sold and cannot be cancelled', 'QUOTATION_ALREADY_CONVERTED');
        }
        return this.prisma.quotation.update({
            where: { id },
            data: { status: 'CANCELLED', updatedBy: userId },
            include: { items: true },
        });
    }
    async convert(userId, id, dto) {
        const quotation = await this.get(id);
        if (quotation.status === 'CONVERTED' || quotation.convertedOrderId) {
            throw new exceptions_1.BusinessException(`Quotation ${quotation.quotationNumber} has already been converted`, 'QUOTATION_ALREADY_CONVERTED');
        }
        if (quotation.status === 'CANCELLED') {
            throw new exceptions_1.BusinessException('A cancelled quotation cannot be sold', 'QUOTATION_CANCELLED');
        }
        if (!quotation.items.length) {
            throw new exceptions_1.BusinessException('This quotation has no products to sell', 'QUOTATION_EMPTY');
        }
        if (quotation.validUntil && quotation.validUntil.getTime() < Date.now()) {
            throw new exceptions_1.BusinessException(`Quotation ${quotation.quotationNumber} expired on ${quotation.validUntil.toISOString().slice(0, 10)}. Re-price it before selling.`, 'QUOTATION_EXPIRED');
        }
        const sale = {
            items: quotation.items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId ?? undefined,
                productName: item.productName,
                variantTitle: item.variantTitle ?? undefined,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: Number(item.unitPrice),
                discountAmount: Number(item.discountAmount),
            })),
            paymentMethod: dto.paymentMethod,
            amountPaid: dto.amountPaid,
            customer: {
                name: quotation.customerName,
                phone: quotation.customerPhone ?? undefined,
                email: quotation.customerEmail ?? undefined,
            },
            terminalId: dto.terminalId,
            discountTotal: Number(quotation.discountTotal),
            taxTotal: Number(quotation.taxTotal),
            notes: `Converted from quotation ${quotation.quotationNumber}`,
        };
        const result = await this.posService.completeSale(userId, sale);
        const orderId = result?.order?.orderId;
        return this.prisma.quotation.update({
            where: { id },
            data: {
                status: 'CONVERTED',
                convertedOrderId: orderId,
                convertedAt: new Date(),
                terminalId: dto.terminalId,
                updatedBy: userId,
            },
            include: { items: true },
        });
    }
};
exports.QuotationService = QuotationService;
exports.QuotationService = QuotationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pos_service_1.PosService])
], QuotationService);
//# sourceMappingURL=quotation.service.js.map