import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from "../../database/prisma.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { ReportService } from './report.service';
export declare class ReportExportWorker extends WorkerHost {
    private readonly prisma;
    private readonly reportService;
    private readonly storageService;
    private readonly logger;
    constructor(prisma: PrismaService, reportService: ReportService, storageService: StorageService);
    process(job: Job<any>): Promise<any>;
    private convertToCsv;
}
