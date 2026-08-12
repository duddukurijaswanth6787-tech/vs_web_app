import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { SizeChartRepository } from './size-chart.repository';
import {
  CreateSizeChartTemplateDto,
  UpdateSizeChartTemplateDto,
  SizeChartQueryDto,
  SizeChartTemplateResponse,
} from './size-chart.types';

@Injectable()
export class SizeChartService {
  constructor(
    private readonly repository: SizeChartRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(t: any): SizeChartTemplateResponse {
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description ?? undefined,
      garmentType: t.garmentType ?? undefined,
      unit: t.unit,
      status: t.status,
      rows: (t.rows ?? []).map((row: any) => ({
        id: row.id,
        size: row.size,
        measurements: (row.measurements ?? {}) as Record<string, number | string>,
        displayOrder: row.displayOrder,
      })),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** Append a counter until the slug is free, so a duplicate name still saves. */
  private async uniqueSlug(base: string, excludeId?: string) {
    const root = this.slugify(base) || 'size-chart';
    let candidate = root;
    let counter = 2;
    while (await this.repository.slugExists(candidate, excludeId)) {
      candidate = `${root}-${counter++}`;
    }
    return candidate;
  }

  async findAll(query: SizeChartQueryDto) {
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

  async findById(id: string) {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new BusinessException('Size chart not found', 'SIZE_CHART_001');
    }
    return this.toResponse(template);
  }

  async findByProductId(productId: string) {
    const template = await this.repository.findByProductId(productId);
    return template ? this.toResponse(template) : null;
  }

  async create(dto: CreateSizeChartTemplateDto, userId: string) {
    const slug = await this.uniqueSlug(dto.slug || dto.name);

    const template = await this.repository.create(
      {
        name: dto.name,
        slug,
        description: dto.description,
        garmentType: dto.garmentType,
        unit: dto.unit ?? 'inch',
        createdBy: userId,
      },
      dto.rows ?? [],
    );

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

  async update(id: string, dto: UpdateSizeChartTemplateDto, userId: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new BusinessException('Size chart not found', 'SIZE_CHART_001');
    }

    const template = await this.repository.update(
      id,
      {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.garmentType !== undefined ? { garmentType: dto.garmentType } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        updatedBy: userId,
      },
      dto.rows,
    );

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      module: 'CATALOG',
      resource: 'SizeChartTemplate',
      resourceId: id,
      newValue: { name: dto.name, rows: dto.rows?.length },
    });

    return this.toResponse(template);
  }

  async remove(id: string, userId: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new BusinessException('Size chart not found', 'SIZE_CHART_001');
    }

    // Products keep pointing at the template until it is detached, so refuse
    // rather than silently stripping the chart off a live catalogue.
    const inUse = await this.repository.countProductsUsing(id);
    if (inUse > 0) {
      throw new BusinessException(
        `This size chart is used by ${inUse} product${inUse === 1 ? '' : 's'}. Detach it first.`,
        'SIZE_CHART_002',
      );
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
}
