import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RagIngestionService } from './rag-ingestion.service';
export declare class RagIngestionWorker extends WorkerHost {
    private readonly ingestionService;
    constructor(ingestionService: RagIngestionService);
    process(job: Job<any>): Promise<any>;
}
