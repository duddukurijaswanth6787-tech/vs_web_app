export declare class CreateColorGroupDto {
    colorAttributeOptionId: string;
    label?: string;
    sortOrder?: number;
}
export declare class UpdateColorGroupDto {
    label?: string;
    sortOrder?: number;
    isActive?: boolean;
}
export declare class SyncColorGroupItemDto {
    id?: string;
    colorAttributeOptionId: string;
    label?: string;
    variantIds?: string[];
    mediaIds?: string[];
}
export declare class SyncColorGroupsDto {
    colorGroups: SyncColorGroupItemDto[];
}
