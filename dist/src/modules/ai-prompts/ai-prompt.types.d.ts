export declare const PROMPT_TYPES: readonly ["PRODUCT_TITLE", "PRODUCT_DESCRIPTION", "SHORT_DESCRIPTION", "SEO_TITLE", "META_DESCRIPTION", "IMAGE_GENERATION", "IMAGE_ALT_TEXT", "SOCIAL_CAPTION"];
export type PromptType = (typeof PROMPT_TYPES)[number];
export declare const PROMPT_VARIABLES: readonly ["product_fields", "rules", "product_name", "category", "subcategory", "fabric", "color", "pattern", "occasion", "fit", "sleeve", "neck", "material", "brand", "collection", "tags"];
export interface PromptTemplate {
    type: PromptType;
    name: string;
    template: string;
    rules: string;
    status: 'ACTIVE' | 'INACTIVE';
    version: number;
    updatedAt: string;
    updatedBy?: string;
}
export declare const ACCURACY_RULE = "Use only the product information provided above. Do not invent, assume, or fabricate missing product information \u2014 including fabric, colour, measurements, size, fit, embroidery, embellishments, design details, manufacturing details, or care instructions. If a detail is not listed above, do not mention it.";
export declare const DEFAULT_TEMPLATES: Record<PromptType, PromptTemplate>;
export declare function extractVariables(template: string): string[];
export declare function unsupportedVariables(template: string): string[];
export declare class UpdatePromptTemplateDto {
    name?: string;
    template?: string;
    rules?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}
export declare class PromptTemplatesResponse {
    templates: PromptTemplate[];
    variables: string[];
    accuracyRule: string;
}
export declare class PromptHistoryEntry {
    version: number;
    updatedAt: string;
    updatedBy?: string;
    template: string;
    rules: string;
}
export declare class PromptTemplateBody {
    body?: Record<string, unknown>;
}
