import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../../database/prisma.service";
import { StartupVersionService } from './startup-version.service';
import { StartupHealthService } from './startup-health.service';
import { StartupInfoService } from './startup-info.service';
import { StartupRendererService } from './startup-renderer.service';
export declare class StartupDashboardService {
    private readonly configService;
    private readonly prismaService;
    private readonly versionService;
    private readonly healthService;
    private readonly infoService;
    private readonly renderer;
    constructor(configService: ConfigService, prismaService: PrismaService, versionService: StartupVersionService, healthService: StartupHealthService, infoService: StartupInfoService, renderer: StartupRendererService);
    printDashboard(startTime: number): Promise<void>;
    private getAiAgents;
    private getBusinessModules;
}
