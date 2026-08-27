import { LoggerService } from "../../common/logger/logger.service";
import { AuditService } from "../audit/audit.service";
import { BrandsRepository } from './brands.repository';
import { CreateBrandDto, UpdateBrandDto, BrandQueryDto, BrandResponse } from './brands.types';
export declare class BrandsService {
    private readonly brandsRepository;
    private readonly auditService;
    private readonly loggerService;
    constructor(brandsRepository: BrandsRepository, auditService: AuditService, loggerService: LoggerService);
    private toResponse;
    findAll(query: BrandQueryDto): Promise<{
        data: BrandResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<BrandResponse>;
    findBySlug(slug: string): Promise<BrandResponse>;
    findFeatured(): Promise<{
        data: BrandResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    private generateUniqueSlug;
    create(dto: CreateBrandDto, userId: string): Promise<BrandResponse>;
    update(id: string, dto: UpdateBrandDto, userId: string): Promise<BrandResponse>;
    delete(id: string, userId: string): Promise<void>;
    restore(id: string, userId: string): Promise<BrandResponse>;
}
