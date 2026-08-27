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
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const constants_1 = require("../../common/constants");
let MonitoringService = class MonitoringService {
    configService;
    startTime = Date.now();
    slowRequestThreshold;
    requestCount = 0;
    successCount = 0;
    errorCount = 0;
    totalResponseTime = 0;
    slowRequestCount = 0;
    constructor(configService) {
        this.configService = configService;
        this.slowRequestThreshold = this.configService.get('app.monitoring.slowRequestThreshold', 1000);
    }
    getSnapshot() {
        const elapsed = Date.now() - this.startTime;
        const mem = process.memoryUsage();
        const totalReqs = this.requestCount;
        return {
            app: {
                name: constants_1.APP_METADATA.NAME,
                version: constants_1.APP_METADATA.VERSION,
                environment: this.configService.get('app.env'),
                uptime: process.uptime(),
                startTime: new Date(this.startTime).toISOString(),
                elapsed: `${(elapsed / 1000 / 60).toFixed(1)} minutes`,
            },
            process: {
                pid: process.pid,
                nodeVersion: process.version,
                platform: process.platform,
                hostname: this.configService.get('app.hostname', 'localhost'),
                memory: {
                    rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
                    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                },
            },
            http: {
                totalRequests: totalReqs,
                successCount: this.successCount,
                errorCount: this.errorCount,
                successRate: totalReqs > 0
                    ? `${((this.successCount / totalReqs) * 100).toFixed(2)}%`
                    : '0%',
                avgResponseTime: totalReqs > 0
                    ? `${(this.totalResponseTime / totalReqs).toFixed(0)}ms`
                    : '0ms',
                slowRequests: this.slowRequestCount,
            },
        };
    }
};
exports.MonitoringService = MonitoringService;
exports.MonitoringService = MonitoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MonitoringService);
//# sourceMappingURL=monitoring.service.js.map