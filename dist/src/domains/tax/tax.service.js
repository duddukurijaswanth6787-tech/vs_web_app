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
exports.TaxService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const tax_repository_1 = require("./tax.repository");
let TaxService = class TaxService {
    taxRepository;
    auditService;
    constructor(taxRepository, auditService) {
        this.taxRepository = taxRepository;
        this.auditService = auditService;
    }
    toResponse(r) {
        return {
            id: r.id,
            name: r.name,
            type: r.type,
            rate: Number(r.rate),
            applicableTo: r.applicableTo ?? undefined,
            isActive: r.isActive,
            priority: r.priority,
            createdAt: r.createdAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.taxRepository.findAll({
            type: query.type,
            isActive: query.isActive,
            page,
            limit,
        });
        return {
            data: result.data.map((r) => this.toResponse(r)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const rule = await this.taxRepository.findById(id);
        if (!rule)
            throw new exceptions_1.BusinessException('Tax rule not found', 'TAX_001');
        return this.toResponse(rule);
    }
    async create(userId, dto) {
        const rule = await this.taxRepository.create({
            name: dto.name,
            type: dto.type,
            rate: dto.rate,
            applicableTo: dto.applicableTo,
            applicableIds: dto.applicableIds ?? [],
            isActive: dto.isActive ?? true,
            priority: dto.priority ?? 0,
        });
        await this.auditService.log({
            action: 'TAX_RULE_CREATED',
            module: 'tax',
            resource: 'TaxRule',
            resourceId: rule.id,
            userId,
        });
        return this.toResponse(rule);
    }
    async update(id, userId, dto) {
        const existing = await this.taxRepository.findById(id);
        if (!existing)
            throw new exceptions_1.BusinessException('Tax rule not found', 'TAX_001');
        const rule = await this.taxRepository.update(id, {
            name: dto.name,
            type: dto.type,
            rate: dto.rate,
            applicableTo: dto.applicableTo,
            applicableIds: dto.applicableIds,
            isActive: dto.isActive,
            priority: dto.priority,
        });
        await this.auditService.log({
            action: 'TAX_RULE_UPDATED',
            module: 'tax',
            resource: 'TaxRule',
            resourceId: id,
            userId,
        });
        return this.toResponse(rule);
    }
    async calculateTax(dto) {
        const rules = await this.taxRepository.findActiveRules();
        const matchingRules = rules.filter((rule) => {
            if (!rule.applicableTo)
                return true;
            if (rule.applicableTo === 'product' && dto.productIds?.length) {
                return rule.applicableIds.some((id) => dto.productIds.includes(id));
            }
            if (rule.applicableTo === 'category' && dto.categoryIds?.length) {
                return rule.applicableIds.some((id) => dto.categoryIds.includes(id));
            }
            return false;
        });
        const taxBreakdown = matchingRules.map((rule) => {
            const rate = Number(rule.rate);
            return {
                type: rule.type,
                rate,
                amount: +((dto.orderAmount * rate) / 100).toFixed(2),
            };
        });
        const taxAmount = +taxBreakdown
            .reduce((sum, item) => sum + item.amount, 0)
            .toFixed(2);
        return {
            orderAmount: dto.orderAmount,
            taxAmount,
            taxBreakdown,
        };
    }
};
exports.TaxService = TaxService;
exports.TaxService = TaxService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tax_repository_1.TaxRepository,
        audit_service_1.AuditService])
], TaxService);
//# sourceMappingURL=tax.service.js.map