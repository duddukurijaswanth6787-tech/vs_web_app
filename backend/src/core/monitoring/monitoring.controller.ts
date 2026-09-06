import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  getMetrics(): Record<string, unknown> {
    if (!this.enabled) {
      throw new NotFoundException('Monitoring is disabled');
    }
    return this.monitoringService.getSnapshot();
  }
}
