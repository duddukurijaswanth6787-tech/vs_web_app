import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { loggerContextStorage } from '@common/logger/logger.context';
import { AuditRepository } from './audit.repository';
import {
  CreateAuditLogDto,
  AuditLogQueryDto,
  AuditLogResponse,
} from './audit.types';
import { BusinessException } from '@common/exceptions';

@Injectable()
export class AuditService {
  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly loggerService: LoggerService,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    const ctx = loggerContextStorage.getStore();
    const entry = {
      ...dto,
      requestId: dto.requestId || ctx?.requestId,
      correlationId: dto.correlationId || ctx?.requestId,
      ipAddress: dto.ipAddress || ctx?.ip,
      userAgent: dto.userAgent || ctx?.userAgent,
      status: dto.status || 'SUCCESS',
    };
    await this.auditRepository.create(entry);
    this.loggerService.log(
      {
        auditAction: dto.action,
        module: dto.module,
        resource: dto.resource,
        resourceId: dto.resourceId,
        status: entry.status,
      },
      'AuditService',
    );
  }

  async logMany(entries: CreateAuditLogDto[]): Promise<void> {
    const ctx = loggerContextStorage.getStore();
    const enriched = entries.map((dto) => ({
      ...dto,
      requestId: dto.requestId || ctx?.requestId,
      ipAddress: dto.ipAddress || ctx?.ip,
      userAgent: dto.userAgent || ctx?.userAgent,
      status: dto.status || 'SUCCESS',
    }));
    await this.auditRepository.createMany(enriched);
    this.loggerService.log(
      { auditAction: 'BULK_CREATE', count: entries.length },
      'AuditService',
    );
  }

  async findAll(query: AuditLogQueryDto) {
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

  async findById(id: string): Promise<AuditLogResponse> {
    const log = await this.auditRepository.findById(id);
    if (!log) throw new BusinessException('Audit log not found', 'AUDIT_001');
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

  async getEntityHistory(resource: string, resourceId: string, limit = 50) {
    return this.auditRepository.findByResource(resource, resourceId, limit);
  }

  async compareVersions(id: string) {
    const log = await this.auditRepository.findById(id);
    if (!log) throw new BusinessException('Audit log not found', 'AUDIT_001');
    const oldVal = (log.oldValue ?? {}) as Record<string, unknown>;
    const newVal = (log.newValue ?? {}) as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
    const changes: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
      changed: boolean;
    }> = [];
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
}
