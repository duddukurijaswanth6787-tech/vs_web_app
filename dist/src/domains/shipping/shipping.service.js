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
exports.ShippingService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const shipping_repository_1 = require("./shipping.repository");
let ShippingService = class ShippingService {
    shippingRepository;
    auditService;
    constructor(shippingRepository, auditService) {
        this.shippingRepository = shippingRepository;
        this.auditService = auditService;
    }
    toMethodResponse(m) {
        return {
            id: m.id,
            name: m.name,
            code: m.code,
            description: m.description ?? undefined,
            estimatedDays: m.estimatedDays,
            isActive: m.isActive,
        };
    }
    toZoneResponse(z) {
        return {
            id: z.id,
            methodId: z.methodId,
            name: z.name,
            countries: z.countries,
            states: z.states,
            rateType: z.rateType,
            rate: Number(z.rate),
            freeAbove: z.freeAbove ? Number(z.freeAbove) : undefined,
        };
    }
    async getMethods() {
        const methods = await this.shippingRepository.findMethods();
        return methods.map((m) => this.toMethodResponse(m));
    }
    async createMethod(dto, userId) {
        const existing = await this.shippingRepository.findMethodByCode(dto.code);
        if (existing)
            throw new exceptions_1.BusinessException('Shipping method code already exists', 'SHIPPING_001');
        const method = await this.shippingRepository.createMethod({
            name: dto.name,
            code: dto.code,
            description: dto.description,
            estimatedDays: dto.estimatedDays,
        });
        await this.auditService.log({
            action: 'SHIPPING_METHOD_CREATED',
            module: 'shipping',
            resource: 'shipping_method',
            resourceId: method.id,
            userId,
            newValue: { name: dto.name, code: dto.code },
        });
        return this.toMethodResponse(method);
    }
    async getZones(methodId) {
        const zones = await this.shippingRepository.findZones(methodId);
        return zones.map((z) => this.toZoneResponse(z));
    }
    async createZone(dto, userId) {
        const method = await this.shippingRepository.findMethodById(dto.methodId);
        if (!method)
            throw new exceptions_1.BusinessException('Shipping method not found', 'SHIPPING_002');
        const zone = await this.shippingRepository.createZone({
            method: { connect: { id: dto.methodId } },
            name: dto.name,
            countries: dto.countries,
            states: dto.states,
            pincodes: dto.pincodes,
            rateType: dto.rateType,
            rate: dto.rate,
            freeAbove: dto.freeAbove,
            maxWeight: dto.maxWeight,
        });
        await this.auditService.log({
            action: 'SHIPPING_ZONE_CREATED',
            module: 'shipping',
            resource: 'shipping_zone',
            resourceId: zone.id,
            userId,
            newValue: { name: dto.name, methodId: dto.methodId },
        });
        return this.toZoneResponse(zone);
    }
    async calculateShipping(dto) {
        const method = await this.shippingRepository.findMethodByCode(dto.methodCode);
        if (!method)
            throw new exceptions_1.BusinessException('Shipping method not found', 'SHIPPING_002');
        const zone = await this.shippingRepository.findMatchingZone(method.id, dto.country, dto.state, dto.pincode);
        if (!zone)
            throw new exceptions_1.BusinessException('No shipping zone found for the given location', 'SHIPPING_003');
        let rate = Number(zone.rate);
        let freeShipping = false;
        if (zone.rateType === 'WEIGHT' && dto.weight) {
            rate = rate * dto.weight;
        }
        if (zone.freeAbove &&
            dto.orderAmount &&
            dto.orderAmount >= Number(zone.freeAbove)) {
            rate = 0;
            freeShipping = true;
        }
        return {
            methodCode: method.code,
            methodName: method.name,
            rate,
            estimatedDelivery: method.estimatedDays,
            freeShipping,
        };
    }
    async getEstimatedDelivery(methodCode) {
        const method = await this.shippingRepository.findMethodByCode(methodCode);
        if (!method)
            throw new exceptions_1.BusinessException('Shipping method not found', 'SHIPPING_002');
        return method.estimatedDays;
    }
};
exports.ShippingService = ShippingService;
exports.ShippingService = ShippingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [shipping_repository_1.ShippingRepository,
        audit_service_1.AuditService])
], ShippingService);
//# sourceMappingURL=shipping.service.js.map