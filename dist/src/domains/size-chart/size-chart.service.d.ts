import { AuditService } from "../audit/audit.service";
import { SizeChartRepository } from './size-chart.repository';
import { CreateSizeChartTemplateDto, UpdateSizeChartTemplateDto, SizeChartQueryDto, SizeChartTemplateResponse } from './size-chart.types';
export declare class SizeChartService {
    private readonly repository;
    private readonly auditService;
    constructor(repository: SizeChartRepository, auditService: AuditService);
    private toResponse;
    private slugify;
    private uniqueSlug;
    findAll(query: SizeChartQueryDto): Promise<{
        data: SizeChartTemplateResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<SizeChartTemplateResponse>;
    findByProductId(productId: string): Promise<SizeChartTemplateResponse | null>;
    create(dto: CreateSizeChartTemplateDto, userId: string): Promise<SizeChartTemplateResponse>;
    update(id: string, dto: UpdateSizeChartTemplateDto, userId: string): Promise<SizeChartTemplateResponse>;
    remove(id: string, userId: string): Promise<void>;
}
