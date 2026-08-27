import { LoggerService } from "../../common/logger/logger.service";
import { AuditService } from "../audit/audit.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto, UpdateCategoryDto, MoveCategoryDto, ReorderCategoriesDto, CategoryQueryDto, CategoryResponse, CategoryTreeNode } from './categories.types';
export declare class CategoriesService {
    private readonly categoriesRepository;
    private readonly auditService;
    private readonly loggerService;
    private readonly storageService;
    constructor(categoriesRepository: CategoriesRepository, auditService: AuditService, loggerService: LoggerService, storageService: StorageService);
    private toResponse;
    findAll(query: CategoryQueryDto): Promise<{
        data: CategoryResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<CategoryResponse>;
    findBySlug(slug: string): Promise<CategoryResponse>;
    findFeatured(): Promise<{
        data: CategoryResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findChildren(id: string): Promise<CategoryResponse[]>;
    findAncestors(id: string): Promise<CategoryResponse[]>;
    getTree(): Promise<CategoryTreeNode[]>;
    private generateUniqueSlug;
    create(dto: CreateCategoryDto, userId: string): Promise<CategoryResponse>;
    update(id: string, dto: UpdateCategoryDto, userId: string): Promise<CategoryResponse>;
    move(id: string, dto: MoveCategoryDto, userId: string): Promise<CategoryResponse>;
    reorder(dto: ReorderCategoriesDto, userId: string): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
    restore(id: string, userId: string): Promise<CategoryResponse>;
}
