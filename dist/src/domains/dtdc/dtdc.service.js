"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DtdcService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DtdcService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const crypto = __importStar(require("crypto"));
let DtdcService = DtdcService_1 = class DtdcService {
    prisma;
    configService;
    auditService;
    logger = new common_1.Logger(DtdcService_1.name);
    constructor(prisma, configService, auditService) {
        this.prisma = prisma;
        this.configService = configService;
        this.auditService = auditService;
    }
    isLive() {
        const enabled = this.configService.get('app.dtdc.enabled', false);
        const apiKey = this.configService.get('app.dtdc.apiKey', '');
        const customerCode = this.configService.get('app.dtdc.customerCode', '');
        return enabled && !!apiKey && !!customerCode;
    }
    mockAwb() {
        return `DTDC${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    }
    async createShipment(dto, userId) {
        const order = await this.prisma.order.findFirst({
            where: { id: dto.orderId, deletedAt: null },
            include: { addresses: true, customer: true },
        });
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        const shipAddr = order.addresses.find((a) => a.addressType === 'SHIPPING') ||
            order.addresses[0];
        if (!shipAddr)
            throw new exceptions_1.BusinessException('Shipping address missing', 'DTDC_001');
        const existing = await this.prisma.dtdcShipment.findFirst({
            where: { orderId: order.id, status: { notIn: ['CANCELLED'] } },
        });
        if (existing)
            throw new exceptions_1.BusinessException('Active DTDC shipment already exists', 'DTDC_002');
        const payload = {
            orderNumber: order.orderNumber,
            serviceType: dto.serviceType ?? 'STANDARD',
            weightKg: dto.weightKg ?? 0.5,
            pieces: dto.pieces ?? 1,
            consignee: {
                name: shipAddr.fullName,
                phone: shipAddr.phone,
                pincode: shipAddr.postalCode,
                address: `${shipAddr.addressLine1} ${shipAddr.addressLine2 ?? ''}`.trim(),
                city: shipAddr.city,
                state: shipAddr.state,
            },
        };
        let awbNumber;
        let rawResponse;
        let status = 'BOOKED';
        if (this.isLive()) {
            const apiUrl = this.configService.get('app.dtdc.apiUrl', 'https://dtdcapi.shipsy.io');
            this.logger.log(`DTDC live booking via ${apiUrl} for order ${order.orderNumber}`);
            awbNumber = this.mockAwb();
            rawResponse = {
                mode: 'live-stub',
                awbNumber,
                note: 'Replace with real DTDC API response',
            };
        }
        else {
            awbNumber = this.mockAwb();
            rawResponse = {
                mode: 'mock',
                awbNumber,
                message: 'DTDC mocked. Set DTDC_ENABLED=true + credentials for live.',
            };
            status = 'BOOKED_MOCK';
        }
        const shipment = await this.prisma.dtdcShipment.create({
            data: {
                orderId: order.id,
                awbNumber,
                status,
                serviceType: dto.serviceType ?? 'STANDARD',
                weightKg: dto.weightKg ?? 0.5,
                pieces: dto.pieces ?? 1,
                consigneeName: shipAddr.fullName,
                consigneePhone: shipAddr.phone,
                consigneePincode: shipAddr.postalCode,
                labelUrl: `/shipping/dtdc/labels/${awbNumber}.pdf`,
                trackingUrl: `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=${awbNumber}`,
                rawRequest: payload,
                rawResponse,
                bookedAt: new Date(),
                createdBy: userId,
            },
        });
        await this.auditService.log({
            action: 'DTDC_SHIPMENT_CREATED',
            module: 'dtdc',
            resource: 'dtdc_shipment',
            resourceId: shipment.id,
            userId,
            newValue: { awbNumber, orderId: order.id },
        });
        return shipment;
    }
    async track(awbOrId) {
        const shipment = await this.prisma.dtdcShipment.findFirst({
            where: { OR: [{ id: awbOrId }, { awbNumber: awbOrId }] },
            include: {
                order: { select: { id: true, orderNumber: true, status: true } },
            },
        });
        if (!shipment)
            throw new exceptions_1.BusinessException('Shipment not found', 'DTDC_003');
        return {
            ...shipment,
            tracking: {
                awbNumber: shipment.awbNumber,
                status: shipment.status,
                trackingUrl: shipment.trackingUrl,
                checkpoints: [
                    {
                        code: 'BOOKED',
                        at: shipment.bookedAt,
                        description: 'Shipment booked',
                    },
                ],
            },
        };
    }
    async getLabel(awbOrId) {
        const shipment = await this.prisma.dtdcShipment.findFirst({
            where: { OR: [{ id: awbOrId }, { awbNumber: awbOrId }] },
        });
        if (!shipment)
            throw new exceptions_1.BusinessException('Shipment not found', 'DTDC_003');
        return {
            awbNumber: shipment.awbNumber,
            labelUrl: shipment.labelUrl,
            status: shipment.status,
        };
    }
    async cancel(awbOrId, dto, userId) {
        const shipment = await this.prisma.dtdcShipment.findFirst({
            where: { OR: [{ id: awbOrId }, { awbNumber: awbOrId }] },
        });
        if (!shipment)
            throw new exceptions_1.BusinessException('Shipment not found', 'DTDC_003');
        if (shipment.status === 'CANCELLED') {
            throw new exceptions_1.BusinessException('Shipment already cancelled', 'DTDC_004');
        }
        const updated = await this.prisma.dtdcShipment.update({
            where: { id: shipment.id },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                rawResponse: {
                    ...(typeof shipment.rawResponse === 'object' && shipment.rawResponse
                        ? shipment.rawResponse
                        : {}),
                    cancelReason: dto.reason ?? 'Cancelled by admin',
                },
            },
        });
        await this.auditService.log({
            action: 'DTDC_SHIPMENT_CANCELLED',
            module: 'dtdc',
            resource: 'dtdc_shipment',
            resourceId: shipment.id,
            userId,
            newValue: { reason: dto.reason },
        });
        return updated;
    }
    async listByOrder(orderId) {
        return this.prisma.dtdcShipment.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.DtdcService = DtdcService;
exports.DtdcService = DtdcService = DtdcService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], DtdcService);
//# sourceMappingURL=dtdc.service.js.map