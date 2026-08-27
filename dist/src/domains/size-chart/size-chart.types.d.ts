export declare class SizeChartRowDto {
    size: string;
    measurements: Record<string, number | string>;
    displayOrder?: number;
}
export declare class CreateSizeChartTemplateDto {
    name: string;
    slug?: string;
    description?: string;
    garmentType?: string;
    unit?: string;
    rows?: SizeChartRowDto[];
}
export declare class UpdateSizeChartTemplateDto {
    name?: string;
    description?: string;
    garmentType?: string;
    unit?: string;
    status?: string;
    rows?: SizeChartRowDto[];
}
export declare class SizeChartQueryDto {
    search?: string;
    garmentType?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class SizeChartRowResponse {
    id: string;
    size: string;
    measurements: Record<string, number | string>;
    displayOrder: number;
}
export declare class SizeChartTemplateResponse {
    id: string;
    name: string;
    slug: string;
    description?: string;
    garmentType?: string;
    unit: string;
    status: string;
    rows: SizeChartRowResponse[];
    createdAt: Date;
    updatedAt: Date;
}
