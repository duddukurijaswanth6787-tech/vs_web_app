import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitoringService } from './monitoring.service';

@Controller('health/metrics')
export class MonitoringController {
  private readonly enabled: boolean;

  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly configService: ConfigService,
  ) {
    this.enabled = this.configService.get<boolean>(
      'app.monitoring.enabled',
      true,
    );
  }

  @Get()
  getMetrics(): Record<string, unknown> {
    if (!this.enabled) {
      throw new NotFoundException('Monitoring is disabled');
    }
    return this.monitoringService.getSnapshot();
  }
}
