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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const logger_context_1 = require("../../common/logger/logger.context");
const audit_repository_1 = require("./audit.repository");
const exceptions_1 = require("../../common/exceptions");
let AuditService = class AuditService {
    auditRepository;
    loggerService;
    constructor(auditRepository, loggerService) {
        this.auditRepository = auditRepository;
        this.loggerService = loggerService;
    }
    async log(dto) {
        const ctx = logger_context_1.loggerContextStorage.getStore();
        const entry = {
            ...dto,
            requestId: dto.requestId || ctx?.requestId,
            correlationId: dto.correlationId || ctx?.requestId,
            ipAddress: dto.ipAddress || ctx?.ip,
            userAgent: dto.userAgent || ctx?.userAgent,
            status: dto.status || 'SUCCESS',
        };
        await this.auditRepository.create(entry);
        this.loggerService.log({
            auditAction: dto.action,
            module: dto.module,
            resource: dto.resource,
            resourceId: dto.resourceId,
            status: entry.status,
        }, 'AuditService');
    }
    async logMany(entries) {
        const ctx = logger_context_1.loggerContextStorage.getStore();
        const enriched = entries.map((dto) => ({
            ...dto,
            requestId: dto.requestId || ctx?.requestId,
            ipAddress: dto.ipAddress || ctx?.ip,
            userAgent: dto.userAgent || ctx?.userAgent,
            status: dto.status || 'SUCCESS',
        }));
        await this.auditRepository.createMany(enriched);
        this.loggerService.log({ auditAction: 'BULK_CREATE', count: entries.length }, 'AuditService');
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        return this.auditRepository.findAll({
            module: query.module,
            action: query.action,
            userId: query.userId,
            staffId: query.staffId,
            resource: query.resource,
            resourceId: query.resourceId,
            status: query.status,
            search: query.search,
            startDate: query.startDate,
            endDate: query.endDate,
            page,
            limit,
            sortBy: query.sortBy ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        });
    }
    async findById(id) {
        const log = await this.auditRepository.findById(id);
        if (!log)
            throw new exceptions_1.BusinessException('Audit log not found', 'AUDIT_001');
        return {
            id: log.id,
            userId: log.userId ?? undefined,
            staffId: log.staffId ?? undefined,
            action: log.action,
            module: log.module,
            resource: log.resource,
            resourceId: log.resourceId ?? undefined,
            oldValue: log.oldValue ?? undefined,
            newValue: log.newValue ?? undefined,
            ipAddress: log.ipAddress ?? undefined,
            userAgent: log.userAgent ?? undefined,
            status: log.status,
            message: log.message ?? undefined,
            metadata: log.metadata ?? undefined,
            createdAt: log.createdAt,
        };
    }
    async getStats() {
        return this.auditRepository.getStats();
    }
    async getEntityHistory(resource, resourceId, limit = 50) {
        return this.auditRepository.findByResource(resource, resourceId, limit);
    }
    async compareVersions(id) {
        const log = await this.auditRepository.findById(id);
        if (!log)
            throw new exceptions_1.BusinessException('Audit log not found', 'AUDIT_001');
        const oldVal = (log.oldValue ?? {});
        const newVal = (log.newValue ?? {});
        const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
        const changes = [];
        for (const key of allKeys) {
            const oldV = key in oldVal ? oldVal[key] : undefined;
            const newV = key in newVal ? newVal[key] : undefined;
            const changed = JSON.stringify(oldV) !== JSON.stringify(newV);
            if (changed) {
                changes.push({ field: key, oldValue: oldV, newValue: newV, changed });
            }
        }
        return {
            id: log.id,
            action: log.action,
            module: log.module,
            resource: log.resource,
            resourceId: log.resourceId,
            timestamp: log.createdAt,
            changes,
            oldValue: oldVal,
            newValue: newVal,
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_repository_1.AuditRepository,
        logger_service_1.LoggerService])
], AuditService);
//# sourceMappingURL=audit.service.js.map