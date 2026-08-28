import { LoggerService } from "../../common/logger/logger.service";
import { AuditService } from "../audit/audit.service";
import { AttributesRepository } from './attributes.repository';
import type { CreateAttributeGroupDto, UpdateAttributeGroupDto, AttributeGroupQueryDto, AttributeGroupResponse, CreateAttributeDto, UpdateAttributeDto, AttributeQueryDto, AttributeResponse, CreateAttributeOptionDto, UpdateAttributeOptionDto, AttributeOptionQueryDto, AttributeOptionResponse, CreateCategoryAttributeDto, UpdateCategoryAttributeDto, CategoryAttributeResponse } from './attributes.types';
export declare class AttributesService {
    private readonly repo;
    private readonly auditService;
    private readonly loggerService;
    constructor(repo: AttributesRepository, auditService: AuditService, loggerService: LoggerService);
    private toGroupResponse;
    private toAttributeResponse;
    private toOptionResponse;
    private toCategoryMappingResponse;
    private genSlug;
    private assertType;
    findAllGroups(query: AttributeGroupQueryDto): Promise<{
        data: AttributeGroupResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findGroupById(id: string): Promise<AttributeGroupResponse>;
    createGroup(dto: CreateAttributeGroupDto, userId: string): Promise<AttributeGroupResponse>;
    updateGroup(id: string, dto: UpdateAttributeGroupDto, userId: string): Promise<AttributeGroupResponse>;
    deleteGroup(id: string, userId: string): Promise<void>;
    restoreGroup(id: string, userId: string): Promise<AttributeGroupResponse>;
    findAllAttributes(query: AttributeQueryDto): Promise<{
        data: AttributeResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findAttributeById(id: string): Promise<AttributeResponse>;
    createAttribute(dto: CreateAttributeDto, userId: string): Promise<AttributeResponse>;
    updateAttribute(id: string, dto: UpdateAttributeDto, userId: string): Promise<AttributeResponse>;
    deleteAttribute(id: string, userId: string): Promise<void>;
    restoreAttribute(id: string, userId: string): Promise<AttributeResponse>;
    findAllOptions(query: AttributeOptionQueryDto): Promise<{
        data: AttributeOptionResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findOptionById(id: string): Promise<AttributeOptionResponse>;
    createOption(dto: CreateAttributeOptionDto, userId: string): Promise<AttributeOptionResponse>;
    updateOption(id: string, dto: UpdateAttributeOptionDto, userId: string): Promise<AttributeOptionResponse>;
    deleteOption(id: string, userId: string): Promise<void>;
    restoreOption(id: string, userId: string): Promise<AttributeOptionResponse>;
    findAllCategoryMappings(categoryId: string): Promise<{
        data: CategoryAttributeResponse[];
    }>;
    createCategoryMapping(dto: CreateCategoryAttributeDto, userId: string): Promise<CategoryAttributeResponse>;
    updateCategoryMapping(categoryId: string, attributeId: string, dto: UpdateCategoryAttributeDto, userId: string): Promise<CategoryAttributeResponse>;
    deleteCategoryMapping(categoryId: string, attributeId: string, userId: string): Promise<void>;
}
