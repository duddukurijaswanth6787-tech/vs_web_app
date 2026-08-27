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
exports.StartupHealthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
let StartupHealthService = class StartupHealthService {
    configService;
    prismaService;
    constructor(configService, prismaService) {
        this.configService = configService;
        this.prismaService = prismaService;
    }
    async getSystemHealth() {
        const redisEnabled = this.configService.get('app.features.redis', true);
        const queueEnabled = this.configService.get('app.features.bullmq', true);
        const storageProvider = this.configService.get('app.storage.provider', 'local');
        return {
            postgres: this.prismaService.isConnected ? 'Connected' : 'Disconnected',
            prisma: this.prismaService.isConnected ? 'Ready' : 'Unavailable',
            migration: 'Up-to-date',
            redis: redisEnabled ? 'Enabled' : 'Disabled',
            queue: queueEnabled ? 'Enabled' : 'Disabled',
            storage: storageProvider === 's3' ? 'AWS S3' : 'Local',
            socket: 'Enabled',
            scheduler: 'Running',
        };
    }
};
exports.StartupHealthService = StartupHealthService;
exports.StartupHealthService = StartupHealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], StartupHealthService);
//# sourceMappingURL=startup-health.service.js.map