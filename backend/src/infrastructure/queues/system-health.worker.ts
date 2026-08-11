import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/**
 * Worker processor for the 'system-health' queue to process background task heartbeats.
 */
@Processor('system-health')
export class SystemHealthWorker extends WorkerHost {
  private readonly logger = new Logger(SystemHealthWorker.name);

  /**
   * Process incoming jobs from the 'system-health' queue.
   */
  async process(
    job: Job<any, any, string>,
  ): Promise<{ status: string; processedAt: string }> {
    this.logger.log(
      `Processing background system job: ${job.name} (ID: ${job.id})`,
    );
    // ponytail: simple task processor stub
    return { status: 'ok', processedAt: new Date().toISOString() };
  }
}
