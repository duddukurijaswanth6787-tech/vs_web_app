import { PrismaService } from "../../database/prisma.service";
import { Queue } from 'bullmq';
import { StorageService } from "../../infrastructure/storage/storage.service";
import { GenerateReportDto, ReportResponse, ExportJobResponse } from './report.types';
export declare class ReportService {
    private readonly prisma;
    private readonly storageService;
    private readonly exportQueue?;
    constructor(prisma: PrismaService, storageService: StorageService, exportQueue?: Queue | undefined);
    generateSalesReport(startDate?: string, endDate?: string, granularity?: string, channel?: string): Promise<ReportResponse>;
    generateInventoryMovementSeries(startDate?: string, endDate?: string, granularity?: string): Promise<ReportResponse>;
    generateInventoryReport(): Promise<ReportResponse>;
    getProductCategoryBreakdown(): Promise<ReportResponse>;
    generateCustomerReport(): Promise<ReportResponse>;
    generateOrderReport(startDate?: string, endDate?: string, channel?: string): Promise<ReportResponse>;
    generateListReport(type: string, startDate?: string, endDate?: string, page?: number, limit?: number): Promise<ReportResponse>;
    getExportJobs(page?: number, limit?: number): Promise<{
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
    }>;
    getExportJobDownloadUrl(id: string): Promise<{
        url: string;
    }>;
    createExportJob(dto: GenerateReportDto, userId: string): Promise<ExportJobResponse>;
    private convertToCsv;
}
