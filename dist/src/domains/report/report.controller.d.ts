import { ReportService } from './report.service';
import { GenerateReportDto } from './report.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    getSalesReport(startDate?: string, endDate?: string, granularity?: string, channel?: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./report.types").ReportResponse>>;
    getProductCategoryBreakdown(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./report.types").ReportResponse>>;
    getInventoryReport(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./report.types").ReportResponse>>;
    getInventoryMovementSeries(startDate?: string, endDate?: string, granularity?: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./report.types").ReportResponse>>;
    getCustomerReport(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./report.types").ReportResponse>>;
    getOrderReport(startDate?: string, endDate?: string, channel?: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./report.types").ReportResponse>>;
    getListReport(type: string, startDate?: string, endDate?: string, page?: string, limit?: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./report.types").ReportResponse>>;
    createExportJob(dto: GenerateReportDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./report.types").ExportJobResponse>>;
    getExportJobs(page?: string, limit?: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: {
            id: string;
            type: string;
            format: string;
            status: string;
            fileUrl: string | undefined;
            error: string | undefined;
            createdAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getExportDownloadUrl(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        url: string;
    }>>;
}
