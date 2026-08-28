"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupDashboardService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const startup_version_service_1 = require("./startup-version.service");
const startup_health_service_1 = require("./startup-health.service");
const startup_info_service_1 = require("./startup-info.service");
const startup_renderer_service_1 = require("./startup-renderer.service");
let StartupDashboardService = class StartupDashboardService {
    configService;
    prismaService;
    versionService;
    healthService;
    infoService;
    renderer;
    constructor(configService, prismaService, versionService, healthService, infoService, renderer) {
        this.configService = configService;
        this.prismaService = prismaService;
        this.versionService = versionService;
        this.healthService = healthService;
        this.infoService = infoService;
        this.renderer = renderer;
    }
    async printDashboard(startTime) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const health = await this.healthService.getSystemHealth();
        const system = this.infoService.getSystemInfo();
        const aiAgents = await this.getAiAgents();
        const modules = this.getBusinessModules();
        const port = this.versionService.getPort();
        const hostname = this.versionService.getHostname();
        const data = {
            env: this.versionService.getEnv(),
            version: this.versionService.getAppVersion(),
            nodeVersion: this.versionService.getNodeVersion(),
            nestVersion: this.versionService.getNestVersion(),
            pid: process.pid,
            startupTime: `${elapsed} s`,
            hostname,
            port,
            apiPrefix: this.versionService.getApiPrefix(),
            swaggerEnabled: this.configService.get('app.features.swagger', true),
            healthEnabled: true,
            health,
            aiAgents,
            system,
            modules,
        };
        process.stdout.write(this.renderer.render(data));
    }
    async getAiAgents() {
        try {
            if (!this.prismaService.isConnected) {
                return [];
            }
            const agents = await this.prismaService.ragAgent.findMany({
                where: { deletedAt: null },
                select: { name: true },
            });
            return agents.map((a) => ({ name: a.name, status: 'Ready' }));
        }
        catch {
            return [];
        }
    }
    getBusinessModules() {
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
};
exports.StartupDashboardService = StartupDashboardService;
exports.StartupDashboardService = StartupDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        startup_version_service_1.StartupVersionService,
        startup_health_service_1.StartupHealthService,
        startup_info_service_1.StartupInfoService,
        startup_renderer_service_1.StartupRendererService])
], StartupDashboardService);
//# sourceMappingURL=startup.service.js.map