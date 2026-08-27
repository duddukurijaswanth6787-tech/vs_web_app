"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReportExportWorker_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExportWorker = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const report_service_1 = require("./report.service");
let ReportExportWorker = ReportExportWorker_1 = class ReportExportWorker extends bullmq_1.WorkerHost {
    prisma;
    reportService;
    storageService;
    logger = new common_1.Logger(ReportExportWorker_1.name);
    constructor(prisma, reportService, storageService) {
        super();
        this.prisma = prisma;
        this.reportService = reportService;
        this.storageService = storageService;
    }
    async process(job) {
        const { jobId, type, startDate, endDate } = job.data;
        this.logger.log(`Processing export job ${jobId} of type ${type}`);
        try {
            await this.prisma.exportJob.update({
                where: { id: jobId },
                data: { status: 'PROCESSING' },
            });
            let reportData;
            if (type === 'SALES') {
                reportData = await this.reportService.generateSalesReport(startDate, endDate);
            }
            else if (type === 'INVENTORY') {
                reportData = await this.reportService.generateInventoryReport();
            }
            else if (type === 'CUSTOMER') {
                reportData = await this.reportService.generateCustomerReport();
            }
            else if (type === 'ORDER') {
                reportData = await this.reportService.generateOrderReport(startDate, endDate);
            }
            else {
                throw new Error(`Unsupported report type: ${type}`);
            }
            const csvString = this.convertToCsv(type, reportData.data);
            const csvBuffer = Buffer.from(csvString, 'utf-8');
            const filename = `export_${type.toLowerCase()}_${Date.now()}.csv`;
            const uploadResult = await this.storageService.upload(csvBuffer, {
                originalName: filename,
                mimeType: 'text/csv',
                folder: `exports/${type.toLowerCase()}/${jobId}`,
            });
            await this.prisma.exportJob.update({
                where: { id: jobId },
                data: {
                    status: 'COMPLETED',
                    fileUrl: uploadResult.key,
                },
            });
            this.logger.log(`Export job ${jobId} completed successfully.`);
        }
        catch (err) {
            this.logger.error(`Export job ${jobId} failed: ${err.message}`, err.stack);
            await this.prisma.exportJob.update({
                where: { id: jobId },
                data: {
                    status: 'FAILED',
                    error: err.message,
                },
            });
        }
    }
    convertToCsv(type, data) {
        if (type === 'SALES') {
            const headers = 'OrderId,OrderNumber,GrandTotal,Status,CreatedAt\n';
            const rows = (data.orders || [])
                .map((o) => `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}"`)
                .join('\n');
            return headers + rows;
        }
        if (type === 'INVENTORY') {
            const headers = 'InventoryId,SKU,Product,Quantity,ReservedQuantity,StockStatus\n';
            const rows = (data.items || [])
                .map((i) => `"${i.id}","${i.variant?.sku || ''}","${i.variant?.product?.name || ''}",${i.quantity},${i.reservedQuantity},"${i.stockStatus}"`)
                .join('\n');
            return headers + rows;
        }
        if (type === 'CUSTOMER') {
            const headers = 'CustomerId,FirstName,LastName,Email,Phone,Gender,OrderCount,TotalSpent\n';
            const rows = (data.customers || [])
                .map((c) => `"${c.id}","${c.user?.firstName || ''}","${c.user?.lastName || ''}","${c.user?.email || ''}","${c.phone || ''}","${c.gender || ''}",${c.orderCount},${c.totalSpent}`)
                .join('\n');
            return headers + rows;
        }
        if (type === 'ORDER') {
            const headers = 'OrderId,OrderNumber,GrandTotal,Status,CreatedAt,ItemsCount\n';
            const rows = (data.orders || [])
                .map((o) => `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}",${o.items?.length || 0}`)
                .join('\n');
            return headers + rows;
        }
        return 'No data';
    }
};
exports.ReportExportWorker = ReportExportWorker;
exports.ReportExportWorker = ReportExportWorker = ReportExportWorker_1 = __decorate([
    (0, bullmq_1.Processor)('report-export'),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        report_service_1.ReportService,
        storage_service_1.StorageService])
], ReportExportWorker);
//# sourceMappingURL=report-export.worker.js.map