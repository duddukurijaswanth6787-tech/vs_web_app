import { AttributesService } from './attributes.service';
import { CreateAttributeGroupDto, UpdateAttributeGroupDto, AttributeGroupQueryDto, CreateAttributeDto, UpdateAttributeDto, AttributeQueryDto, CreateAttributeOptionDto, UpdateAttributeOptionDto, AttributeOptionQueryDto, CreateCategoryAttributeDto, UpdateCategoryAttributeDto, CategoryAttributesQueryDto } from './attributes.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class AttributesController {
    private readonly attributesService;
    constructor(attributesService: AttributesService);
    findAllGroups(query: AttributeGroupQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./attributes.types").AttributeGroupResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findGroupById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeGroupResponse>>;
    createGroup(dto: CreateAttributeGroupDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeGroupResponse>>;
    updateGroup(id: string, dto: UpdateAttributeGroupDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeGroupResponse>>;
    deleteGroup(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    restoreGroup(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeGroupResponse>>;
    findAllAttributes(query: AttributeQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./attributes.types").AttributeResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findAttributeById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeResponse>>;
    createAttribute(dto: CreateAttributeDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeResponse>>;
    updateAttribute(id: string, dto: UpdateAttributeDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeResponse>>;
    deleteAttribute(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    restoreAttribute(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeResponse>>;
    findAllOptions(query: AttributeOptionQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./attributes.types").AttributeOptionResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findOptionById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeOptionResponse>>;
    createOption(dto: CreateAttributeOptionDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeOptionResponse>>;
    updateOption(id: string, dto: UpdateAttributeOptionDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeOptionResponse>>;
    deleteOption(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    restoreOption(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").AttributeOptionResponse>>;
    findAllCategoryMappings(query: CategoryAttributesQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./attributes.types").CategoryAttributeResponse[];
    }>>;
    createCategoryMapping(dto: CreateCategoryAttributeDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").CategoryAttributeResponse>>;
    updateCategoryMapping(categoryId: string, attributeId: string, dto: UpdateCategoryAttributeDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./attributes.types").CategoryAttributeResponse>>;
    deleteCategoryMapping(categoryId: string, attributeId: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
}
