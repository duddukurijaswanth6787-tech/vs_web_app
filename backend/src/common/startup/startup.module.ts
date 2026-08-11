import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { StartupVersionService } from './startup-version.service';
import { StartupHealthService } from './startup-health.service';
import { StartupInfoService } from './startup-info.service';
import { StartupRendererService } from './startup-renderer.service';
import { StartupDashboardService } from './startup.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    StartupVersionService,
    StartupHealthService,
    StartupInfoService,
    StartupRendererService,
    StartupDashboardService,
  ],
  exports: [StartupDashboardService],
})
export class StartupModule {}
