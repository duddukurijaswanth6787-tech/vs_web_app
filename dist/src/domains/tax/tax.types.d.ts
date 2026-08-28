export declare enum TaxType {
    GST = "GST",
    CGST = "CGST",
    SGST = "SGST",
    IGST = "IGST"
}
export declare class CreateTaxRuleDto {
    name: string;
    type: TaxType;
    rate: number;
    applicableTo?: string;
    applicableIds?: string[];
    isActive?: boolean;
    priority?: number;
}
export declare class UpdateTaxRuleDto {
    name?: string;
    type?: TaxType;
    rate?: number;
    applicableTo?: string;
    applicableIds?: string[];
    isActive?: boolean;
    priority?: number;
}
export declare class CalculateTaxDto {
    orderAmount: number;
    productIds?: string[];
    categoryIds?: string[];
}
export declare class TaxBreakdownItem {
    type: string;
    rate: number;
    amount: number;
}
export declare class TaxRuleResponse {
    id: string;
    name: string;
    type: string;
    rate: number;
    applicableTo?: string;
    isActive: boolean;
    priority: number;
    createdAt: Date;
}
export declare class TaxCalculationResponse {
    orderAmount: number;
    taxAmount: number;
    taxBreakdown: TaxBreakdownItem[];
}
export declare class TaxRuleListResponse {
    data: TaxRuleResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
