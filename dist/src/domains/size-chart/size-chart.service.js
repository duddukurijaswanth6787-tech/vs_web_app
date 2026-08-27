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
exports.SizeChartService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const size_chart_repository_1 = require("./size-chart.repository");
let SizeChartService = class SizeChartService {
    repository;
    auditService;
    constructor(repository, auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }
    toResponse(t) {
        return {
            id: t.id,
            name: t.name,
            slug: t.slug,
            description: t.description ?? undefined,
            garmentType: t.garmentType ?? undefined,
            unit: t.unit,
            status: t.status,
            rows: (t.rows ?? []).map((row) => ({
                id: row.id,
                size: row.size,
                measurements: (row.measurements ?? {}),
                displayOrder: row.displayOrder ?? 0,
            })),
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
        };
    }
    slugify(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    async uniqueSlug(base, excludeId) {
        const root = this.slugify(base) || 'size-chart';
        let candidate = root;
        let counter = 2;
        while (await this.repository.slugExists(candidate, excludeId)) {
            candidate = `${root}-${counter++}`;
        }
        return candidate;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const { data, total } = await this.repository.findAll({
            search: query.search,
            garmentType: query.garmentType,
            status: query.status,
            page,
            limit,
        });
        return {
            data: data.map((t) => this.toResponse(t)),
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
    async findById(id) {
        const template = await this.repository.findById(id);
        if (!template) {
            throw new exceptions_1.BusinessException('Size chart not found', 'SIZE_CHART_001');
        }
        return this.toResponse(template);
    }
    async findByProductId(productId) {
        const template = await this.repository.findByProductId(productId);
        return template ? this.toResponse(template) : null;
    }
    async create(dto, userId) {
        const slug = await this.uniqueSlug(dto.slug || dto.name);
        const template = await this.repository.create({
            name: dto.name,
            slug,
            description: dto.description,
            garmentType: dto.garmentType,
            unit: dto.unit ?? 'inch',
            createdBy: userId,
        }, dto.rows ?? []);
        await this.auditService.log({
            userId,
            action: 'CREATE',
            module: 'CATALOG',
            resource: 'SizeChartTemplate',
            resourceId: template.id,
            newValue: { name: template.name, rows: dto.rows?.length ?? 0 },
        });
        return this.toResponse(template);
    }
    async update(id, dto, userId) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new exceptions_1.BusinessException('Size chart not found', 'SIZE_CHART_001');
        }
        const template = await this.repository.update(id, {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.description !== undefined
                ? { description: dto.description }
                : {}),
            ...(dto.garmentType !== undefined
                ? { garmentType: dto.garmentType }
                : {}),
            ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            updatedBy: userId,
        }, dto.rows);
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            module: 'CATALOG',
            resource: 'SizeChartTemplate',
            resourceId: id,
            newValue: { name: dto.name, rows: dto.rows?.length },
        });
        if (!template) {
            throw new exceptions_1.BusinessException('Size chart not found', 'SIZE_CHART_001');
        }
        return this.toResponse(template);
    }
    async remove(id, userId) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new exceptions_1.BusinessException('Size chart not found', 'SIZE_CHART_001');
        }
        const inUse = await this.repository.countProductsUsing(id);
        if (inUse > 0) {
            throw new exceptions_1.BusinessException(`This size chart is used by ${inUse} product${inUse === 1 ? '' : 's'}. Detach it first.`, 'SIZE_CHART_002');
        }
        await this.repository.softDelete(id);
        await this.auditService.log({
            userId,
            action: 'DELETE',
            module: 'CATALOG',
            resource: 'SizeChartTemplate',
            resourceId: id,
        });
    }
};
exports.SizeChartService = SizeChartService;
exports.SizeChartService = SizeChartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [size_chart_repository_1.SizeChartRepository,
        audit_service_1.AuditService])
], SizeChartService);
//# sourceMappingURL=size-chart.service.js.map