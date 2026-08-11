import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { ReportService } from './report.service';

@Processor('report-export')
@Injectable()
export class ReportExportWorker extends WorkerHost {
  private readonly logger = new Logger(ReportExportWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: ReportService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { jobId, type, startDate, endDate } = job.data;
    this.logger.log(`Processing export job ${jobId} of type ${type}`);

    try {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING' },
      });

      let reportData: any;
      if (type === 'SALES') {
        reportData = await this.reportService.generateSalesReport(
          startDate,
          endDate,
        );
      } else if (type === 'INVENTORY') {
        reportData = await this.reportService.generateInventoryReport();
      } else if (type === 'CUSTOMER') {
        reportData = await this.reportService.generateCustomerReport();
      } else if (type === 'ORDER') {
        reportData = await this.reportService.generateOrderReport(
          startDate,
          endDate,
        );
      } else {
        throw new Error(`Unsupported report type: ${type}`);
      }

      // Convert to CSV
      const csvString = this.convertToCsv(type, reportData.data);
      const csvBuffer = Buffer.from(csvString, 'utf-8');

      // Upload to StorageService
      const filename = `export_${type.toLowerCase()}_${Date.now()}.csv`;
      const uploadResult = await this.storageService.upload(csvBuffer, {
        originalName: filename,
        mimeType: 'text/csv',
        folder: `exports/${type.toLowerCase()}/${jobId}`,
      });

      // Update ExportJob
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          fileUrl: uploadResult.key,
        },
      });

      this.logger.log(`Export job ${jobId} completed successfully.`);
    } catch (err: any) {
      this.logger.error(
        `Export job ${jobId} failed: ${err.message}`,
        err.stack,
      );
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: err.message,
        },
      });
    }
  }

  private convertToCsv(type: string, data: any): string {
    if (type === 'SALES') {
      const headers = 'OrderId,OrderNumber,GrandTotal,Status,CreatedAt\n';
      const rows = (data.orders || [])
        .map(
          (o: any) =>
            `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}"`,
        )
        .join('\n');
      return headers + rows;
    }
    if (type === 'INVENTORY') {
      const headers =
        'InventoryId,SKU,Product,Quantity,ReservedQuantity,StockStatus\n';
      const rows = (data.items || [])
        .map(
          (i: any) =>
            `"${i.id}","${i.variant?.sku || ''}","${i.variant?.product?.name || ''}",${i.quantity},${i.reservedQuantity},"${i.stockStatus}"`,
        )
        .join('\n');
      return headers + rows;
    }
    if (type === 'CUSTOMER') {
      const headers =
        'CustomerId,FirstName,LastName,Email,Phone,Gender,OrderCount,TotalSpent\n';
      const rows = (data.customers || [])
        .map(
          (c: any) =>
            `"${c.id}","${c.user?.firstName || ''}","${c.user?.lastName || ''}","${c.user?.email || ''}","${c.phone || ''}","${c.gender || ''}",${c.orderCount},${c.totalSpent}`,
        )
        .join('\n');
      return headers + rows;
    }
    if (type === 'ORDER') {
      const headers =
        'OrderId,OrderNumber,GrandTotal,Status,CreatedAt,ItemsCount\n';
      const rows = (data.orders || [])
        .map(
          (o: any) =>
            `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}",${o.items?.length || 0}`,
        )
        .join('\n');
      return headers + rows;
    }
    return 'No data';
  }
}
