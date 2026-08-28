export declare enum ReportType {
    SALES = "SALES",
    INVENTORY = "INVENTORY",
    CUSTOMER = "CUSTOMER",
    PAYMENT = "PAYMENT",
    ORDER = "ORDER",
    PRODUCTS = "PRODUCTS",
    COUPONS = "COUPONS",
    RETURNS = "RETURNS",
    TAX = "TAX",
    SHIPPING = "SHIPPING",
    CATEGORIES = "CATEGORIES",
    BRANDS = "BRANDS",
    REVIEWS = "REVIEWS"
}
export declare enum ExportFormat {
    CSV = "CSV",
    EXCEL = "EXCEL"
}
export declare class GenerateReportDto {
    type: ReportType;
    startDate?: string;
    endDate?: string;
    format?: ExportFormat;
}
export declare class ReportResponse {
    type: string;
    data: any;
    generatedAt: Date;
}
export declare class ExportJobResponse {
    id: string;
    type: string;
    format: string;
    status: string;
    fileUrl?: string;
    createdAt: Date;
}
