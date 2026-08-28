export declare class CreatePromptTemplateDto {
    name: string;
    template: string;
    variables: string[];
    description?: string;
}
export declare class UpdatePromptTemplateDto {
    template?: string;
    variables?: string[];
    description?: string;
    isActive?: boolean;
}
export declare class PromptTemplateResponse {
    id: string;
    name: string;
    template: string;
    variables: string[];
    description?: string;
    isActive: boolean;
    version: number;
    createdAt: Date;
}
export declare class PromptTemplateQueryDto {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
export declare class AiUsageLogResponse {
    id: string;
    userId?: string;
    feature: string;
    tokensUsed: number;
    cost: number;
    createdAt: Date;
}
