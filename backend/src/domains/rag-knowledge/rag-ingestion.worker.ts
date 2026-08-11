import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { RagIngestionService } from './rag-ingestion.service';

@Processor('rag-ingestion')
export class RagIngestionWorker extends WorkerHost {
  constructor(private readonly ingestionService: RagIngestionService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { sourceId } = job.data;
    await this.ingestionService.processIngestion(sourceId);
  }
}
