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
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const invoice_repository_1 = require("./invoice.repository");
const prisma_service_1 = require("../../database/prisma.service");
let InvoiceService = class InvoiceService {
    invoiceRepository;
    auditService;
    prisma;
    constructor(invoiceRepository, auditService, prisma) {
        this.invoiceRepository = invoiceRepository;
        this.auditService = auditService;
        this.prisma = prisma;
    }
    toItemResponse(item) {
        return {
            id: item.id,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            taxAmount: Number(item.taxAmount),
            discountAmount: Number(item.discountAmount),
        };
    }
    toResponse(inv, includeItems = false) {
        return {
            id: inv.id,
            orderId: inv.orderId,
            invoiceNumber: inv.invoiceNumber,
            status: inv.status,
            subtotal: Number(inv.subtotal),
            taxTotal: Number(inv.taxTotal),
            discountTotal: Number(inv.discountTotal),
            grandTotal: Number(inv.grandTotal),
            currency: inv.currency,
            billingAddress: inv.billingAddress ?? undefined,
            shippingAddress: inv.shippingAddress ?? undefined,
            notes: inv.notes ?? undefined,
            items: includeItems && inv.items
                ? inv.items.map((i) => this.toItemResponse(i))
                : undefined,
            createdAt: inv.createdAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.invoiceRepository.findAll({
            orderId: query.orderId,
            status: query.status,
            page,
            limit,
        });
        return {
            data: result.data.map((inv) => this.toResponse(inv)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const invoice = await this.invoiceRepository.findById(id);
        if (!invoice)
            throw new exceptions_1.BusinessException('Invoice not found', 'INVOICE_001');
        return this.toResponse(invoice, true);
    }
    async findByOrderId(orderId) {
        const invoices = await this.invoiceRepository.findByOrderId(orderId);
        return invoices.map((inv) => this.toResponse(inv, true));
    }
    async create(userId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: { items: true },
        });
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        const invoiceNumber = await this.invoiceRepository.generateInvoiceNumber();
        const invoice = await this.invoiceRepository.create({
            order: { connect: { id: dto.orderId } },
            invoiceNumber,
            subtotal: order.subtotal,
            taxTotal: order.taxTotal,
            discountTotal: order.discountTotal,
            grandTotal: order.grandTotal,
            currency: order.currency,
            billingAddress: dto.billingAddress ?? undefined,
            shippingAddress: dto.shippingAddress ?? undefined,
            notes: dto.notes,
            createdBy: userId,
            items: {
                create: order.items.map((item) => ({
                    productName: item.productName,
                    sku: item.sku,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    taxAmount: item.taxAmount,
                    discountAmount: item.discountAmount,
                })),
            },
        });
        await this.auditService.log({
            action: 'INVOICE_CREATED',
            module: 'invoice',
            resource: 'Invoice',
            resourceId: invoice.id,
            userId,
        });
        return this.toResponse(invoice, true);
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [invoice_repository_1.InvoiceRepository,
        audit_service_1.AuditService,
        prisma_service_1.PrismaService])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map