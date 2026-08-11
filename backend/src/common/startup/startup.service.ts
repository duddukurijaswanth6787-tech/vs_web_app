import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { StartupVersionService } from './startup-version.service';
import { StartupHealthService } from './startup-health.service';
import { StartupInfoService } from './startup-info.service';
import {
  StartupRendererService,
  DashboardData,
} from './startup-renderer.service';

@Injectable()
export class StartupDashboardService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly versionService: StartupVersionService,
    private readonly healthService: StartupHealthService,
    private readonly infoService: StartupInfoService,
    private readonly renderer: StartupRendererService,
  ) {}

  async printDashboard(startTime: number): Promise<void> {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const health = await this.healthService.getSystemHealth();
    const system = this.infoService.getSystemInfo();
    const aiAgents = await this.getAiAgents();
    const modules = this.getBusinessModules();
    const port = this.versionService.getPort();
    const hostname = this.versionService.getHostname();

    const data: DashboardData = {
      env: this.versionService.getEnv(),
      version: this.versionService.getAppVersion(),
      nodeVersion: this.versionService.getNodeVersion(),
      nestVersion: this.versionService.getNestVersion(),
      pid: process.pid,
      startupTime: `${elapsed} s`,
      hostname,
      port,
      apiPrefix: this.versionService.getApiPrefix(),
      swaggerEnabled: this.configService.get<boolean>(
        'app.features.swagger',
        true,
      ),
      healthEnabled: true,
      health,
      aiAgents,
      system,
      modules,
    };

    process.stdout.write(this.renderer.render(data));
  }

  private async getAiAgents(): Promise<{ name: string; status: string }[]> {
    try {
      if (!this.prismaService.isConnected) {
        return [];
      }
      const agents = await (
        this.prismaService as unknown as {
          ragAgent: {
            findMany: (args: {
              where: { deletedAt: null };
              select: { name: boolean };
            }) => Promise<{ name: string }[]>;
          };
        }
      ).ragAgent.findMany({
        where: { deletedAt: null },
        select: { name: true },
      });
      return agents.map((a) => ({ name: a.name, status: 'Ready' }));
    } catch {
      return [];
    }
  }

  private getBusinessModules(): string[] {
    return [
      'Authentication',
      'Customers',
      'Products',
      'Inventory',
      'Orders',
      'Payments',
      'Dashboard',
      'Notifications',
      'Analytics',
      'Reports',
      'Uploads',
      'AI',
    ];
  }
}
