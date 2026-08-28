import { AttributeType } from "../../shared/commerce/commerce.enums";
export declare class CreateAttributeGroupDto {
    name: string;
    slug?: string;
    description?: string;
    displayOrder?: number;
}
export declare class UpdateAttributeGroupDto {
    name?: string;
    slug?: string;
    description?: string;
    displayOrder?: number;
    status?: string;
}
export declare class AttributeGroupQueryDto {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class AttributeGroupResponse {
    id: string;
    name: string;
    slug: string;
    description?: string;
    displayOrder: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CreateAttributeDto {
    groupId: string;
    name: string;
    slug?: string;
    type: AttributeType;
    description?: string;
    displayOrder?: number;
    isRequired?: boolean;
    isFilterable?: boolean;
    isSearchable?: boolean;
    isComparable?: boolean;
    isVariant?: boolean;
    usesSwatch?: boolean;
}
export declare class UpdateAttributeDto {
    name?: string;
    slug?: string;
    type?: AttributeType;
    description?: string;
    displayOrder?: number;
    isRequired?: boolean;
    isFilterable?: boolean;
    isSearchable?: boolean;
    isComparable?: boolean;
    isVariant?: boolean;
    usesSwatch?: boolean;
    status?: string;
}
export declare class AttributeQueryDto {
    groupId?: string;
    search?: string;
    status?: string;
    type?: AttributeType;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class AttributeResponse {
    id: string;
    groupId: string;
    groupName?: string;
    name: string;
    slug: string;
    type: string;
    description?: string;
    displayOrder: number;
    isRequired: boolean;
    isFilterable: boolean;
    isSearchable: boolean;
    isComparable: boolean;
    isVariant: boolean;
    usesSwatch: boolean;
    status: string;
    options?: AttributeOptionResponse[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class CreateAttributeOptionDto {
    attributeId: string;
    value: string;
    label: string;
    swatchImageUrl?: string;
    metadata?: Record<string, unknown>;
    displayOrder?: number;
}
export declare class UpdateAttributeOptionDto {
    value?: string;
    label?: string;
    swatchImageUrl?: string;
    metadata?: Record<string, unknown>;
    displayOrder?: number;
    status?: string;
}
export declare class AttributeOptionQueryDto {
    attributeId: string;
    page?: number;
    limit?: number;
}
export declare class AttributeOptionResponse {
    id: string;
    attributeId: string;
    value: string;
    label: string;
    swatchImageUrl?: string;
    metadata?: Record<string, unknown>;
    displayOrder: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CreateCategoryAttributeDto {
    categoryId: string;
    attributeId: string;
    displayOrder?: number;
    isRequired?: boolean;
    isFilterable?: boolean;
    isSearchable?: boolean;
    isComparable?: boolean;
    isVariant?: boolean;
}
export declare class UpdateCategoryAttributeDto {
    displayOrder?: number;
    isRequired?: boolean;
    isFilterable?: boolean;
    isSearchable?: boolean;
    isComparable?: boolean;
    isVariant?: boolean;
}
export declare class CategoryAttributeResponse {
    categoryId: string;
    attributeId: string;
    displayOrder: number;
    isRequired: boolean;
    isFilterable: boolean;
    isSearchable: boolean;
    isComparable: boolean;
    isVariant: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CategoryAttributesQueryDto {
    categoryId: string;
}
export declare class AttributeGroupListResponse {
    data: AttributeGroupResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class AttributeListResponse {
    data: AttributeResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class AttributeOptionListResponse {
    data: AttributeOptionResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class CategoryAttributeListResponse {
    data: CategoryAttributeResponse[];
}
